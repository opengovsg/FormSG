import type { FieldResponsesV4, FormFieldsV3 } from '@opengovsg/formsg-sdk'
import { adaptV3ToV4 } from '@opengovsg/formsg-sdk'
import { VIRUS_SCANNER_SUBMISSION_VERSION } from 'formsg-shared/constants'
import { BasicField, FieldResponse } from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'

import { IAttachmentInfo, MapRouteError } from '../../../../types'
import {
  ParsedClearAttachmentFieldResponseV4,
  ParsedClearAttachmentResponse,
  ParsedClearFormFieldResponse,
} from '../../../../types/api'
import { createLoggerWithLabel } from '../../../config/logger'

import {
  InitialiseMultipartReceiverError,
  MultipartError,
} from './receiver.errors'
import {
  isBodyVersion2AndBelow,
  isBodyVersion3AndAbove,
  ParsedMultipartForm,
} from './receiver.types'

const logger = createLoggerWithLabel(module)

export const mapRouteError: MapRouteError = (error) => {
  switch (error.constructor) {
    case InitialiseMultipartReceiverError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: 'Required headers are missing',
      }
    case MultipartError:
      return {
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
        errorMessage: 'Submission could not be parsed.',
      }
    default:
      logger.error({
        message: 'mapRouteError called with unknown error type',
        meta: {
          action: 'mapRouteError',
        },
        error,
      })
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: 'Something went wrong. Please refresh and try again.',
      }
  }
}

/**
 * Stale-FE compatibility shim for MRF submissions.
 *
 * If body.version indicates a V3 MRF submission (>=3 && <4), responses are V3-shaped.
 * Convert them to V4 in place and bump body.version to 4 so downstream code can
 * uniformly treat the body as V4. Runs BEFORE addAttachmentToResponses, so
 * attachment buffers land in V4-shaped answer objects.
 *
 * Question text is left empty here — the form definition isn't yet loaded. Downstream
 * code that needs question text should source it from the form definition.
 */
export const adaptMrfV3BodyToV4 = (
  body: ParsedMultipartForm<unknown>,
): void => {
  const version = body.version ?? 0
  if (
    version < 3 ||
    version >= 4 ||
    !body.responses ||
    Array.isArray(body.responses)
  ) {
    return
  }

  logger.warn({
    message:
      'Adapting V3 MRF submission to V4 — client is on a stale build and should refresh',
    meta: { action: 'adaptMrfV3BodyToV4', version },
  })

  body.responses = adaptV3ToV4(
    body.responses as unknown as FormFieldsV3,
  ) as FieldResponsesV4
}

/**
 * Adds the attachment's content, filename to each response,
 * based on their fieldId.
 * The response's answer is also changed to the attachment's filename.
 *
 * @param responses - Array of responses received
 * @param attachments - Array of file objects
 * @returns void. Modifies responses in place.
 */
export const addAttachmentToResponses = (
  body: ParsedMultipartForm<FieldResponse[] | FieldResponsesV4>,
  attachments: IAttachmentInfo[],
): void => {
  // default to 0 for email mode forms where version is undefined
  // TODO (FRM-1413): change to a version existence guardrail when
  // virus scanning has completed rollout, so that virus scanning
  // cannot be bypassed on storage mode submissions.
  const isVirusScannerEnabled =
    (body.version ?? 0) >= VIRUS_SCANNER_SUBMISSION_VERSION

  // Create a map of the attachments with fieldId as keys
  const attachmentMap: Record<IAttachmentInfo['fieldId'], IAttachmentInfo> =
    attachments.reduce<Record<string, IAttachmentInfo>>((acc, attachment) => {
      acc[attachment.fieldId] = attachment
      return acc
    }, {})

  if (isBodyVersion2AndBelow(body)) {
    const responses = body.responses as ParsedClearFormFieldResponse[]
    if (responses) {
      // matches responses to attachments using id, adding filename and content to response
      responses.forEach((response) => {
        if (
          response.fieldType === BasicField.Attachment &&
          response._id in attachmentMap
        ) {
          const file = attachmentMap[response._id]
          const attachmentResponse = response as ParsedClearAttachmentResponse
          attachmentResponse.filename = file.filename
          attachmentResponse.content = file.content
          if (!isVirusScannerEnabled) {
            attachmentResponse.answer = file.filename
          }
        }
      })
    }
  }

  if (isBodyVersion3AndAbove(body)) {
    Object.keys(body.responses).forEach((id) => {
      const response = body.responses[
        id
      ] as unknown as ParsedClearAttachmentFieldResponseV4
      if (response.fieldType === BasicField.Attachment && id in attachmentMap) {
        const file = attachmentMap[id]
        response.answer.filename = file.filename
        response.answer.content = file.content
      }
    })
  }
}

/**
 * Looks for duplicated filenames and changes the filename
 * to for example 1-abc.txt, 2-abc.txt.
 * One of the duplicated files will not have its name changed.
 * Two abc.txt will become 1-abc.txt and abc.txt
 * @param attachments - Array of file objects
 * @returns void. Modifies array in-place.
 */
export const handleDuplicatesInAttachments = (
  attachments: IAttachmentInfo[],
): void => {
  const names = new Map()

  // fill up the map, the key: filename and value: count
  attachments.forEach((a) => {
    if (names.get(a.filename)) {
      names.set(a.filename, names.get(a.filename) + 1)
    } else {
      names.set(a.filename, 1)
    }
  })

  // Change names of duplicates
  attachments.forEach((a) => {
    if (names.get(a.filename) > 1) {
      const count = names.get(a.filename) - 1
      names.set(a.filename, count)
      a.filename = `${count}-${a.filename}`
    }
  })
}
