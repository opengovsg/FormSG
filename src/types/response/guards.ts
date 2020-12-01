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
  if (
    'answerArray' in response &&
    Array.isArray(response.answerArray) &&
    // Check that all elements in answerArray are table rows
    // Necessary to check answerArray[0] separately as every() returns true on empty array
    response.answerArray.every((arr: any) => isTableRow(arr)) &&
    isTableRow(response.answerArray[0])
  ) {
    // Check that all arrays in answerArray have the same length
    const subArrLength: number = response.answerArray[0].length
    return response.answerArray
      .map((arr: ITableRow): number => arr.length)
      .every((length: number): boolean => length === subArrLength)
  }
  return false
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
