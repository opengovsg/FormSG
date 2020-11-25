import { BasicField } from '../../../../types'
import {
  ProcessedCheckboxResponse,
  ProcessedFieldResponse,
  ProcessedSingleAnswerResponse,
  ProcessedTableResponse,
} from '../submission.types'

import {
  EmailAutoReplyField,
  EmailDataForOneField,
  EmailJsonField,
} from './email-submission.types'

/**
 * Determines the prefix for a question based on whether it is verified
 * by MyInfo.
 * @param {Object} response
 * @param {Set} hashedFields Hash for verifying MyInfo fields
 * @returns {String}
 */
const getMyInfoPrefix = (
  response: ProcessedFieldResponse,
  hashedFields: Set<string>,
): string => {
  return !!response.myInfo?.attr && hashedFields.has(response._id)
    ? '[MyInfo] '
    : ''
}

/**
 * Determines the prefix for a question based on whether it was verified
 * by a user during form submission.
 * @param response
 * @returns the prefix
 */
const getVerifiedPrefix = (response: ProcessedFieldResponse): string => {
  return response.isUserVerified ? `[verified] ` : ''
}

/**
 * Determines the prefix for a question based on its field type.
 * @param fieldType
 * @returns the prefix
 */
const getFieldTypePrefix = (response: ProcessedFieldResponse): string => {
  switch (response.fieldType) {
    case BasicField.Table:
      return `[table] `
    case BasicField.Attachment:
      return `[attachment] `
    default:
      return ''
  }
}

/**
 * Transforms a question for inclusion in the JSON data used by the
 * data collation tool.
 * @param response
 */
export const getJsonPrefixedQuestion = (
  response: ProcessedFieldResponse,
): string => {
  const questionComponents = [getFieldTypePrefix(response), response.question]
  return questionComponents.join('')
}

/**
 * Transforms a question for inclusion in the admin email table.
 * @param response
 * @param hashedFields
 */
export const getFormDataPrefixedQuestion = (
  response: ProcessedFieldResponse,
  hashedFields: Set<string>,
): string => {
  const questionComponents = [
    getFieldTypePrefix(response),
    getMyInfoPrefix(response, hashedFields),
    getVerifiedPrefix(response),
    response.question,
  ]
  return questionComponents.join('')
}

/**
 * Creates one response for every row of the table using the answerArray
 * @param response
 * @param response.answerArray an array of array<string> for each row of the table
 * @returns array of duplicated response for each answer in the answerArray
 */
export const getAnswerRowsForTable = (
  response: ProcessedTableResponse,
): ProcessedSingleAnswerResponse[] => {
  return response.answerArray.map((answer) => {
    return Object.assign({}, response, { answer: String(answer) })
  })
}

/**
 * Creates a response for checkbox, with its answer formatted from the answerArray
 * @param response
 * @param response.answerArray an array of strings for each checked option
 * @returns the response with formatted answer
 */
export const getAnswerForCheckbox = (
  response: ProcessedCheckboxResponse,
): ProcessedSingleAnswerResponse => {
  return Object.assign({}, response, {
    answer: response.answerArray.join(', '),
  })
}

/**
 *  Formats the response for sending to the submitter (autoReplyData),
 *  the table that is sent to the admin (formData),
 *  and the json used by data collation tool (jsonData).
 *
 * @param response
 * @param hashedFields Field IDs hashed to verify answers provided by MyInfo
 * @returns an object containing three sets of formatted responses
 */
export const getFormattedResponse = (
  response: ProcessedSingleAnswerResponse,
  hashedFields: Set<string>,
): EmailDataForOneField => {
  const { question, answer, fieldType, isVisible } = response
  const answerSplitByNewLine = answer.split('\n')

  let autoReplyData: EmailAutoReplyField | undefined = undefined
  let jsonData: EmailJsonField | undefined = undefined
  // Auto reply email will contain only visible fields
  if (isVisible) {
    autoReplyData = {
      question, // No prefixes for autoreply
      answerTemplate: answerSplitByNewLine,
    }
  }

  // Headers are excluded from JSON data
  if (fieldType !== BasicField.Section) {
    jsonData = {
      question: getJsonPrefixedQuestion(response),
      answer,
    }
  }

  // Send all the fields to admin
  const formData = {
    question: getFormDataPrefixedQuestion(response, hashedFields),
    answerTemplate: answerSplitByNewLine,
    answer,
    fieldType,
  }
  return {
    autoReplyData,
    jsonData,
    formData,
  }
}
