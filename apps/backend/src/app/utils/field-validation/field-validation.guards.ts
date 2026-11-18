import { types as basicTypes } from 'formsg-shared/constants/field/basic'
import { BasicField, TableRow } from 'formsg-shared/types'
import { isStringArray } from 'formsg-shared/utils/is-string-array'
import { get } from 'lodash'

import { ParsedClearFormFieldResponseV4 } from 'src/types/api'

import { IEmailFieldSchema } from '../../../types'
import {
  ColumnResponse,
  ProcessedAddressResponse,
  ProcessedAttachmentResponse,
  ProcessedCheckboxResponse,
  ProcessedChildrenResponse,
  ProcessedFieldResponse,
  ProcessedSignatureResponse,
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

export const isProcessedAddressResponse = (
  response: ProcessedFieldResponse,
): response is ProcessedAddressResponse => {
  return (
    response.fieldType === BasicField.Address &&
    'answerArray' in response &&
    isStringArray(response.answerArray)
  )
}

export const isProcessedSignatureResponse = (
  response: ProcessedFieldResponse,
): response is ProcessedSignatureResponse => {
  return (
    response.fieldType === BasicField.Signature &&
    'answerArray' in response &&
    isStringArray(response.answerArray)
  )
}

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

// V4 field types whose answer is StringAnswerV4 ({ value: string }).
// Matches StringFieldResponseV4 in packages/sdk/src/types-v4.ts. Section is
// included here because V4 models Section as a StringAnswerV4.
const GENERIC_STRING_ANSWER_FIELD_TYPES_V4: string[] = [
  BasicField.Section,
  BasicField.Number,
  BasicField.Decimal,
  BasicField.ShortText,
  BasicField.LongText,
  BasicField.HomeNo,
  BasicField.Dropdown,
  BasicField.Rating,
  BasicField.Nric,
  BasicField.Uen,
  BasicField.Date,
  BasicField.CountryRegion,
]

export const isGenericStringAnswerResponseV4 = (
  response: ParsedClearFormFieldResponseV4,
): boolean => {
  return (
    GENERIC_STRING_ANSWER_FIELD_TYPES_V4.includes(response.fieldType) &&
    'answer' in response &&
    response.answer !== null &&
    typeof response.answer === 'object' &&
    'value' in response.answer &&
    typeof (response.answer as { value: unknown }).value === 'string'
  )
}
