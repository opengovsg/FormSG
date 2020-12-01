import {
  isProcessedCheckboxResponse,
  isProcessedTableResponse,
} from '../../../utils/field-validation/field-validation.guards'
import { ProcessedFieldResponse } from '../submission.types'

import { EmailData, EmailDataForOneField } from './email-submission.types'
import {
  getAnswerForCheckbox,
  getAnswerRowsForTable,
  getFormattedResponse,
} from './email-submission.util'

/**
 * Creates data to be included in the response and autoreply emails.
 * @param parsedResponses Processed and validated responses
 * @param hashedFields IDs of fields whose responses have been verified by MyInfo hashes
 */
export const createEmailData = (
  parsedResponses: ProcessedFieldResponse[],
  hashedFields: Set<string>,
): EmailData => {
  const emailData: EmailData = {
    autoReplyData: [],
    jsonData: [],
    formData: [],
  }
  parsedResponses.forEach((response) => {
    let formattedResponses: EmailDataForOneField[]
    if (isProcessedTableResponse(response)) {
      formattedResponses = getAnswerRowsForTable(response).map((row) =>
        getFormattedResponse(row, hashedFields),
      )
    } else if (isProcessedCheckboxResponse(response)) {
      const checkbox = getAnswerForCheckbox(response)
      formattedResponses = [getFormattedResponse(checkbox, hashedFields)]
    } else {
      formattedResponses = [getFormattedResponse(response, hashedFields)]
    }
    formattedResponses.forEach((formattedResponse) => {
      if (formattedResponse.autoReplyData) {
        emailData.autoReplyData.push(formattedResponse.autoReplyData)
      }
      if (formattedResponse.jsonData) {
        emailData.jsonData.push(formattedResponse.jsonData)
      }
      emailData.formData.push(formattedResponse.formData)
    })
  })
  return emailData
}
