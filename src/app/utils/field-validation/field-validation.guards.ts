import { get } from 'lodash'

import { ParsedClearFormFieldResponseV3 } from 'src/types/api'

import { types as basicTypes } from '../../../../shared/constants/field/basic'
import {
  BasicField,
  GenericStringAnswerResponseFieldV3,
  TableRow,
} from '../../../../shared/types'
import { IEmailFieldSchema } from '../../../types'
import {
  ColumnResponse,
  ProcessedAttachmentResponse,
  ProcessedCheckboxResponse,
  ProcessedChildrenResponse,
  ProcessedFieldResponse,
  ProcessedSingleAnswerResponse,
  ProcessedTableResponse,
} from '../../modules/submission/submission.types'

const singleAnswerFieldTypes = basicTypes
  .filter((field) => !field.answerArray && field.name !== BasicField.Attachment)
  .map((f) => f.name)

export const isProcessedSingleAnswerResponse = (
  response: ProcessedFieldResponse,
): response is ProcessedSingleAnswerResponse => {
  return (
    singleAnswerFieldTypes.includes(response.fieldType) &&
    'answer' in response &&
    typeof response.answer === 'string'
  )
}

export const isProcessedCheckboxResponse = (
  response: ProcessedFieldResponse,
): response is ProcessedCheckboxResponse => {
  return (
    response.fieldType === BasicField.Checkbox &&
    'answerArray' in response &&
    isStringArray(response.answerArray)
  )
}

export const isProcessedChildResponse = (
  response: ProcessedFieldResponse,
): response is ProcessedChildrenResponse => {
  return (
    response.fieldType === BasicField.Children &&
    'answerArray' in response &&
    response.answerArray.every((subArr) => isStringArray(subArr)) &&
    'childSubFieldsArray' in response &&
    isStringArray(response.childSubFieldsArray)
  )
}

const isStringArray = (arr: unknown): arr is string[] =>
  Array.isArray(arr) && arr.every((item) => typeof item === 'string')

// Check that the row contains a single array of only string (including empty string)
export const isTableRow = (row: unknown): row is TableRow =>
  isStringArray(row) && row.length > 0

export const isProcessedTableResponse = (
  response: ProcessedFieldResponse,
): response is ProcessedTableResponse => {
  if (
    response.fieldType === BasicField.Table &&
    'answerArray' in response &&
    Array.isArray(response.answerArray) &&
    response.answerArray.length > 0 &&
    response.answerArray.every(isTableRow)
  ) {
    // Check that all arrays in answerArray have the same length
    const subArrLength: number = response.answerArray[0].length
    return response.answerArray.every((arr) => arr.length === subArrLength)
  }
  return false
}

export const isColumnResponseContainingAnswer = (
  response: ColumnResponse,
): response is ProcessedSingleAnswerResponse => {
  return 'answer' in response
}

export const isProcessedAttachmentResponse = (
  response: ProcessedFieldResponse,
): response is ProcessedAttachmentResponse => {
  return (
    response.fieldType === BasicField.Attachment &&
    'answer' in response &&
    typeof response.answer === 'string'
    // No check for response.filename as response.filename is generated only when actual file is uploaded
    // Hence hidden attachment fields - which still return empty response - will not have response.filename property
  )
}

/**
 * Utility to check if the given field is a possible IEmailFieldSchema object.
 * Can be used to assign IEmailFieldSchema variables safely.
 * @param field the field to check
 * @returns true if given field's fieldType is BasicField.Email.
 */
export const isPossibleEmailFieldSchema = (
  field: unknown,
): field is Partial<IEmailFieldSchema> => {
  return get(field, 'fieldType') === BasicField.Email
}

/**
 *
 * Checks if the fieldType has an answer that is a generic string type, does not include enums that evaluate to string.
 * @param fieldType the fieldType to check
 */
export const isGenericStringAnswerResponseV3 = (
  response: ParsedClearFormFieldResponseV3,
): boolean => {
  const genericStringAnswerFieldTypesV3: string[] = Object.values(
    GenericStringAnswerResponseFieldV3,
  )
  return (
    genericStringAnswerFieldTypesV3.includes(response.fieldType) &&
    'answer' in response &&
    typeof response.answer === 'string'
  )
}
