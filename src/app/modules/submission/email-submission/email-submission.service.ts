import crypto from 'crypto'
import stringify from 'json-stringify-deterministic'
import { sumBy } from 'lodash'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { sessionSecret } from '../../../../config/config'
import { createLoggerWithLabel } from '../../../../config/logger'
import { FieldResponse } from '../../../../types'
import {
  isProcessedCheckboxResponse,
  isProcessedTableResponse,
} from '../../../utils/field-validation/field-validation.guards'
import { ProcessedFieldResponse } from '../submission.types'

import {
  AttachmentTooLargeError,
  InvalidFileExtensionError,
} from './email-submission.errors'
import {
  EmailAutoReplyField,
  EmailData,
  EmailDataForOneField,
  EmailFormField,
  EmailJsonField,
  ParsedMultipartForm,
} from './email-submission.types'
import {
  getAnswerForCheckbox,
  getAnswerRowsForTable,
  getFormattedResponse,
  getInvalidFileExtensions,
  mapAttachmentsFromResponses,
} from './email-submission.util'

const logger = createLoggerWithLabel(module)

/**
 * Creates response and autoreply email data for a single response.
 * Helper function for createEmailData.
 * @param response Processed and validated response for one field
 * @param hashedFields IDs of fields whose responses have been verified by MyInfo hashes
 */
const createEmailDataForOneField = (
  response: ProcessedFieldResponse,
  hashedFields: Set<string>,
): EmailDataForOneField[] => {
  if (isProcessedTableResponse(response)) {
    return getAnswerRowsForTable(response).map((row) =>
      getFormattedResponse(row, hashedFields),
    )
  } else if (isProcessedCheckboxResponse(response)) {
    const checkbox = getAnswerForCheckbox(response)
    return [getFormattedResponse(checkbox, hashedFields)]
  } else {
    return [getFormattedResponse(response, hashedFields)]
  }
}

/**
 * Creates data to be included in the response and autoreply emails.
 * @param parsedResponses Processed and validated responses
 * @param hashedFields IDs of fields whose responses have been verified by MyInfo hashes
 */
export const createEmailData = (
  parsedResponses: ProcessedFieldResponse[],
  hashedFields: Set<string>,
): EmailData => {
  // First, get an array of email data for each response
  // Each field has an array of email data to accommodate table fields,
  // which have multiple rows of data per field. Hence flatten and maintain
  // the order of responses.
  return (
    parsedResponses
      .flatMap((response) => createEmailDataForOneField(response, hashedFields))
      // Then reshape such that autoReplyData, jsonData and formData are each arrays
      .reduce(
        (acc, dataForOneField) => {
          if (dataForOneField.autoReplyData) {
            acc.autoReplyData.push(dataForOneField.autoReplyData)
          }
          if (dataForOneField.jsonData) {
            acc.jsonData.push(dataForOneField.jsonData)
          }
          acc.formData.push(dataForOneField.formData)
          return acc
        },
        {
          autoReplyData: [] as EmailAutoReplyField[],
          jsonData: [] as EmailJsonField[],
          formData: [] as EmailFormField[],
        },
      )
  )
}

/**
 * Validates that the attachments in a submission do not violate form-level
 * constraints e.g. form-wide attachment size limit.
 * @param parsedResponses Unprocessed responses
 */
export const validateAttachments = (
  parsedResponses: FieldResponse[],
): ResultAsync<true, InvalidFileExtensionError | AttachmentTooLargeError> => {
  const logMeta = { action: 'validateAttachments' }
  const attachments = mapAttachmentsFromResponses(parsedResponses)
  // Check if total attachments size is < 7mb
  const totalAttachmentSize = sumBy(attachments, (a) => a.content.byteLength)
  if (totalAttachmentSize > 7000000) {
    logger.error({
      message: 'Attachment size is too large',
      meta: logMeta,
    })
    return errAsync(new AttachmentTooLargeError())
  }
  return ResultAsync.fromPromise(
    getInvalidFileExtensions(attachments),
    (error) => {
      logger.error({
        message: 'Error while validating attachment file extensions',
        meta: logMeta,
        error,
      })
      return new InvalidFileExtensionError()
    },
  ).andThen((invalidExtensions) => {
    if (invalidExtensions.length > 0) {
      logger.error({
        message: 'Invalid file extensions found',
        meta: {
          ...logMeta,
          invalidExtensions,
        },
      })
      return errAsync(new InvalidFileExtensionError())
    }
    return okAsync(true)
  })
}

/**
 * Hashes a submission for logging purposes
 * @param body Response body
 * @param uinFin UIN or FIN if present
 */
export const hashSubmission = (
  body: ParsedMultipartForm,
  uinFin?: string,
): { hashedUinFin?: string; hashedSubmission?: string } => {
  const hashedUinFin = uinFin
    ? crypto.createHmac('sha256', sessionSecret).update(uinFin).digest('hex')
    : undefined
  const attachments = mapAttachmentsFromResponses(body.responses)
  const concatenatedResponse = stringify(body) + stringify(attachments)
  const hashedSubmission = concatenatedResponse
    ? crypto
        .createHmac('sha256', sessionSecret)
        .update(concatenatedResponse)
        .digest('hex')
    : undefined
  return { hashedUinFin, hashedSubmission }
}
