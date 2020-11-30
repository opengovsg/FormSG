import {
  ProcessedAttachmentResponse,
  ProcessedCheckboxResponse,
  ProcessedFieldResponse,
  ProcessedSingleAnswerResponse,
  ProcessedTableResponse,
} from 'src/app/modules/submission/submission.types'

import { ITableRow } from './index'

const isProcessedFieldResponse = (
  response: any,
): response is ProcessedFieldResponse => {
  return (
    'fieldType' in response &&
    typeof response.fieldType === 'string' &&
    'isVisible' in response &&
    typeof response.isVisible === 'boolean'
  )
}

export const isProcessedSingleAnswerResponse = (
  response: any,
): response is ProcessedSingleAnswerResponse => {
  return (
    'answer' in response &&
    typeof response.answer === 'string' &&
    isProcessedFieldResponse(response)
  )
}

export const isProcessedCheckboxResponse = (
  response: any,
): response is ProcessedCheckboxResponse => {
  return (
    'answerArray' in response &&
    Array.isArray(response.answerArray) &&
    // Check that all elements in answerArray are string (including empty string)
    response.answerArray.every((elem: any) => typeof elem === 'string') &&
    isProcessedFieldResponse(response)
  )
}

export const isTableRow = (row: any): row is ITableRow => {
  return (
    // Check that the row contains a single array of only string (including empty string)
    Array.isArray(row) && row.every((elem: any) => typeof elem === 'string')
  )
}

export const isProcessedTableResponse = (
  response: any,
): response is ProcessedTableResponse => {
  return (
    'answerArray' in response &&
    Array.isArray(response.answerArray) &&
    // Check that all elements in answerArray are table rows
    response.answerArray.every((arr: any) => isTableRow(arr)) &&
    isProcessedFieldResponse(response)
  )
}

export const isProcessedAttachmentResponse = (
  response: any,
): response is ProcessedAttachmentResponse => {
  return (
    'filename' in response &&
    typeof response.filename === 'string' &&
    isProcessedFieldResponse(response)
  )
}
