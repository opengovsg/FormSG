import type {
  AttachmentAnswerV4,
  FieldResponsesV4,
  FormFieldsV3,
} from '@opengovsg/formsg-sdk'
import { adaptV3ToV4 } from '@opengovsg/formsg-sdk'
import { VIRUS_SCANNER_SUBMISSION_VERSION } from 'formsg-shared/constants'
import { BasicField, FieldResponse } from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'
import { err, ok, Result } from 'neverthrow'
import { z } from 'zod'

import { IAttachmentInfo, MapRouteError } from '../../../../types'
import {
  ParsedClearAttachmentAnswerV4,
  ParsedClearAttachmentResponse,
  ParsedClearFormFieldResponse,
} from '../../../../types/api'
import { createLoggerWithLabel } from '../../../config/logger'

import {
  InitialiseMultipartReceiverError,
  MultipartContentParsingError,
  MultipartError,
} from './receiver.errors'
import {
  isBodyVersion2AndBelow,
  isBodyVersion3AndAbove,
  ParsedMultipartForm,
} from './receiver.types'

const logger = createLoggerWithLabel(module)

const attachmentAnswerV4Schema = z.object({
  value: z.string(),
  hasBeenScanned: z.boolean().default(false),
  md5Hash: z.string().optional(),
  // RATIONALE: pin to the AttachmentAnswerV4 type to avoid type drift
}) satisfies z.ZodType<AttachmentAnswerV4, z.ZodTypeDef, unknown>

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
 * Convert them to V4 in place. body.version is left untouched (still 3), so
 * downstream version checks must treat 3 and 4 alike; only body.responses is
 * uniformly V4 after this point. Runs BEFORE addAttachmentToResponses, so
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
 * @returns error if a V3+ attachment response has no file part. Modifies responses in place.
 */
export const addAttachmentToResponses = (
  body: ParsedMultipartForm<FieldResponse[] | FieldResponsesV4>,
  attachments: IAttachmentInfo[],
): Result<void, MultipartContentParsingError> => {
  // default to 0 for email mode forms where version is undefined
  // TODO (FRM-1413): change to a version existence guardrail when
  // virus scanning has completed rollout, so that virus scanning
  // cannot be bypassed on storage mode submissions.
  const isVirusScannerEnabled =
    (body.version ?? 0) >= VIRUS_SCANNER_SUBMISSION_VERSION

  const attachmentsByFieldId = new Map(
    attachments.map((attachment) => [attachment.fieldId, attachment]),
  )

  if (isBodyVersion2AndBelow(body)) {
    const responses = body.responses as ParsedClearFormFieldResponse[]
    if (responses) {
      // matches responses to attachments using id, adding filename and content to response
      responses.forEach((response) => {
        const file = attachmentsByFieldId.get(response._id)
        if (response.fieldType === BasicField.Attachment && file) {
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
    for (const [id, response] of Object.entries(body.responses)) {
      if (response.fieldType !== BasicField.Attachment) continue
      const answer = attachmentAnswerV4Schema.safeParse(response.answer)
      if (!answer.success) {
        return err(
          new MultipartContentParsingError(
            `Attachment response ${id} has an invalid answer`,
          ),
        )
      }
      // NOTE: The file part is required since its the only source of the attachment's filename,
      // which later becomes the answer value once the clean file is retrieved.
      const file = attachmentsByFieldId.get(id)
      if (!file) {
        return err(
          new MultipartContentParsingError(
            `Attachment response ${id} has no matching file part`,
          ),
        )
      }
      const parsedAnswer: ParsedClearAttachmentAnswerV4 = {
        ...answer.data,
        filename: file.filename,
        content: file.content,
      }
      response.answer = parsedAnswer
    }
  }

  return ok(undefined)
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
