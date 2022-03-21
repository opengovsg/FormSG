import {
  CheckboxFieldValues,
  MultiAnswerValue,
  RadioFieldValues,
  SingleAnswerValue,
  TableFieldValues,
  VerifiableFieldValues,
  YesNoFieldValue,
} from '~templates/Field/types'

/**
 * Regex to validate yyyy-mm-dd strings.
 * @note this does not validate that the date is valid, just that the format is correct.
 */
const ISO_8601_DATE_ONLY_REGEX =
  /^\d{4}-([0][1-9]|1[0-2])-([0-2][1-9]|[1-3]0|3[01])$/

export const validateMultiAnswerInput = (
  input: unknown,
): input is MultiAnswerValue => {
  return Array.isArray(input) && input.every((i) => typeof i === 'string')
}

export const validateTableInput = (
  input: unknown,
): input is TableFieldValues => {
  return (
    Array.isArray(input) &&
    input.every((rowData) => {
      if (typeof rowData !== 'object') return false
      return Object.keys(rowData).every(
        (colId) => typeof rowData[colId] === 'string',
      )
    })
  )
}

export const validateAttachmentInput = (input: unknown): input is File => {
  return input instanceof File
}

export const validateCheckboxInput = (
  input: unknown,
): input is CheckboxFieldValues => {
  if (typeof input !== 'object') {
    return false
  }
  const { value, othersInput } = input as CheckboxFieldValues
  return (
    validateMultiAnswerInput(value || []) &&
    (othersInput === undefined || typeof othersInput === 'string')
  )
}

export const validateRadioInput = (
  input: unknown,
): input is RadioFieldValues => {
  if (typeof input !== 'object') {
    return false
  }
  const { value, othersInput } = input as RadioFieldValues
  return (
    validateSingleAnswerInput(value) &&
    (othersInput === undefined || typeof othersInput === 'string')
  )
}

export const validateVerifiableInput = (
  input: unknown,
): input is VerifiableFieldValues => {
  if (typeof input !== 'object') {
    return false
  }
  const { signature, value } = input as VerifiableFieldValues
  return (
    typeof value === 'string' &&
    (signature === undefined || typeof signature === 'string')
  )
}

export const validateSingleAnswerInput = (
  input: unknown,
): input is SingleAnswerValue => {
  return typeof input === 'string'
}

export const validateDateInput = (
  input: unknown,
): input is SingleAnswerValue => {
  return (
    typeof input === 'string' &&
    ISO_8601_DATE_ONLY_REGEX.test(input) &&
    !isNaN(new Date(input).getTime())
  )
}

export const validateYesNoInput = (
  input: unknown,
): input is YesNoFieldValue => {
  return typeof input === 'string' && ['Yes', 'No'].includes(input)
}
