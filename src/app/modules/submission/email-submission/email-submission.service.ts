import { flatten } from 'lodash'

import {
  isProcessedCheckboxResponse,
  isProcessedTableResponse,
} from '../../../utils/field-validation/field-validation.guards'
import { ProcessedFieldResponse } from '../submission.types'

import {
  EmailAutoReplyField,
  EmailData,
  EmailDataForOneField,
  EmailFormField,
  EmailJsonField,
} from './email-submission.types'
import {
  getAnswerForCheckbox,
  getAnswerRowsForTable,
  getFormattedResponse,
} from './email-submission.util'

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
  const emailDataByField = parsedResponses.map((response) => {
    return createEmailDataForOneField(response, hashedFields)
  })
  // Each field has an array of email data to accommodate table fields,
  // which have multiple rows of data per field. Hence flatten and maintain
  // the order of responses.
  const emailDataFlattened = flatten(emailDataByField)
  // Then reshape such that autoReplyData, jsonData and formData are each arrays
  const emailData = emailDataFlattened.reduce(
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
  return emailData
}
