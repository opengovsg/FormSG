import { StatusCodes } from 'http-status-codes'

import { VIRUS_SCANNER_SUBMISSION_VERSION } from '../../../../../shared/constants'
import {
  BasicField,
  FieldResponse,
  FieldResponsesV3,
} from '../../../../../shared/types'
import { IAttachmentInfo, MapRouteError } from '../../../../types'
import {
  ParsedClearAttachmentResponse,
  ParsedClearFormFieldResponse,
  ParsedClearFormFieldResponseV3,
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
 * Checks whether attachmentMap contains the given response id.
 * @param attachmentMap Map of field ids to attachments
 * @param response The response field id to check
 * @returns true if response is in map, false otherwise
 */
const checkIsAttachmentResponsesIdInMap = (
  attachmentMap: Record<IAttachmentInfo['fieldId'], IAttachmentInfo>,
  responseId: string,
): boolean => {
  return !!attachmentMap[responseId]
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
  body: ParsedMultipartForm<FieldResponse[] | FieldResponsesV3>,
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
        if (checkIsAttachmentResponsesIdInMap(attachmentMap, response._id)) {
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
      const response = body.responses[id] as ParsedClearFormFieldResponseV3
      if (
        response.fieldType === BasicField.Attachment &&
        checkIsAttachmentResponsesIdInMap(attachmentMap, id)
      ) {
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
