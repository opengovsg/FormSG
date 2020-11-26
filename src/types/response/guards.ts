import {
  ProcessedAttachmentResponse,
  ProcessedCheckboxResponse,
  ProcessedFieldResponse,
  ProcessedSingleAnswerResponse,
  ProcessedTableResponse,
} from 'src/app/modules/submission/submission.types'

import { types as basicTypes } from '../../shared/resources/basic'
import { BasicField } from '../field'

import { ITableRow } from './index'

const answerArrayFieldTypes = basicTypes
  .filter((field) => field.answerArray)
  .map((f) => f.name)

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
    isProcessedFieldResponse(response) &&
    !answerArrayFieldTypes.includes(response.fieldType)
  )
}

export const isProcessedCheckboxResponse = (
  response: any,
): response is ProcessedCheckboxResponse => {
  return (
    !!response &&
    isStringArray(response.answerArray) &&
    isProcessedFieldResponse(response) &&
    response.fieldType === BasicField.Checkbox
  )
}

const isStringArray = (arr: unknown): arr is string[] =>
  Array.isArray(arr) && arr.every((item) => typeof item === 'string')

// Check that the row contains a single array of only string (including empty string)
export const isTableRow = (row: unknown): row is ITableRow =>
  isStringArray(row) && row.length > 0

export const isProcessedTableResponse = (
  response: any,
): response is ProcessedTableResponse => {
  if (
    !!response &&
    Array.isArray(response.answerArray) &&
    response.answerArray.length > 0 &&
    response.answerArray.every(isTableRow) &&
    isProcessedFieldResponse(response) &&
    response.fieldType === BasicField.Table
  ) {
    // Check that all arrays in answerArray have the same length
    const subArrLength: number = response.answerArray[0].length
    return response.answerArray.every((arr) => arr.length === subArrLength)
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
