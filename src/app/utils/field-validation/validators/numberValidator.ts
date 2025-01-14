import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import {
  BasicField,
  NumberResponseV3,
  NumberSelectedLengthValidation,
  NumberSelectedValidation,
} from '../../../../../shared/types'
import { INumberFieldSchema, OmitUnusedValidatorProps } from '../../../../types'
import { ParsedClearFormFieldResponseV3 } from '../../../../types/api'
import {
  ResponseValidator,
  ResponseValidatorConstructor,
} from '../../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

import {
  notEmptySingleAnswerResponse,
  notEmptySingleAnswerResponseV3,
} from './common'

type NumberValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type NumberValidatorConstructor = (
  numberField: OmitUnusedValidatorProps<INumberFieldSchema>,
) => NumberValidator

/**
 * Return a validator to check if number format is correct.
 */
const numberFormatValidator: NumberValidator = (response) => {
  const { answer } = response
  return /^\d*$/.test(answer)
    ? right(response)
    : left(`NumberValidator:\t answer is not a valid number format`)
}

/**
 * Returns a validation function to check if number length is
 * less than the minimum length specified.
 */
const minLengthValidator: NumberValidatorConstructor =
  (numberField) => (response) => {
    const { answer } = response
    const { customVal } = numberField.ValidationOptions.LengthValidationOptions
    return !customVal || answer.length >= customVal
      ? right(response)
      : left(`NumberValidator:\t answer is shorter than custom minimum length`)
  }

/**
 * Returns a validation function to check if number length is
 * more than the maximum length specified.
 */
const maxLengthValidator: NumberValidatorConstructor =
  (numberField) => (response) => {
    const { answer } = response
    const { customVal } = numberField.ValidationOptions.LengthValidationOptions
    return !customVal || answer.length <= customVal
      ? right(response)
      : left(`NumberValidator:\t answer is longer than custom maximum length`)
  }

/**
 * Returns a validation function to check if number length is
 * equal to the exact length specified.
 */
const exactLengthValidator: NumberValidatorConstructor =
  (numberField) => (response) => {
    const { answer } = response
    const { customVal } = numberField.ValidationOptions.LengthValidationOptions
    return !customVal || answer.length === customVal
      ? right(response)
      : left(`NumberValidator:\t answer does not match custom exact length`)
  }

/**
 * Returns the appropriate number length validation function
 * based on the number length validation option selected.
 */
const getNumberLengthValidator: NumberValidatorConstructor = (numberField) => {
  switch (
    numberField.ValidationOptions.LengthValidationOptions
      .selectedLengthValidation
  ) {
    // Assume that the validation options are valid (customVal exists).
    case NumberSelectedLengthValidation.Min:
      return minLengthValidator(numberField)
    case NumberSelectedLengthValidation.Max:
      return maxLengthValidator(numberField)
    case NumberSelectedLengthValidation.Exact:
      return exactLengthValidator(numberField)
    default:
      return right
  }
}

/**
 * Returns a validation function to check if number is
 * within the number range specified.
 */
const rangeValidator: NumberValidatorConstructor =
  (numberField) => (response) => {
    // Chained validators ensure that the cast to Number is valid
    const val = Number(response.answer)
    // Assume that the range passed in validation options is valid
    const { customMin, customMax } =
      numberField.ValidationOptions.RangeValidationOptions
    const isWithinMinimum = customMin === null || customMin <= val
    const isWithinMaximum = customMax === null || val <= customMax

    return isWithinMinimum && isWithinMaximum
      ? right(response)
      : left(`NumberValidator:\t answer does not fall within specified range`)
  }

/**
 * Returns the appropriate number validation function
 * based on the number validation option selected.
 */
const getNumberValidator: NumberValidatorConstructor = (numberField) => {
  switch (numberField.ValidationOptions.selectedValidation) {
    case NumberSelectedValidation.Length:
      return getNumberLengthValidator(numberField)
    case NumberSelectedValidation.Range:
      return rangeValidator(numberField)
    default:
      return right
  }
}

/**
 * Returns a validation function for a number field when called.
 */
export const constructNumberValidator: NumberValidatorConstructor = (
  numberField,
) =>
  flow(
    notEmptySingleAnswerResponse,
    chain(numberFormatValidator),
    chain(getNumberValidator(numberField)),
  )

const isNumberResponseV3: ResponseValidator<
  ParsedClearFormFieldResponseV3,
  NumberResponseV3
> = (response) => {
  if (response.fieldType !== BasicField.Number) {
    return left(
      'NumberValidatorV3.fieldTypeMismatch:\tfield type is not number',
    )
  }
  return right(response)
}

/**
 * Return a validator to check if number format is correct.
 */
const numberFormatValidatorV3: ResponseValidator<NumberResponseV3> = (
  response,
) => {
  const { answer } = response
  return /^\d*$/.test(answer)
    ? right(response)
    : left(`NumberValidator:\t answer is not a valid number format`)
}

/**
 * Returns a validation function to check if number length is
 * less than the minimum length specified.
 */
const minLengthValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<INumberFieldSchema>,
  NumberResponseV3
> = (numberField) => (response) => {
  const { answer } = response
  const { customVal } = numberField.ValidationOptions.LengthValidationOptions
  return !customVal || answer.length >= customVal
    ? right(response)
    : left(`NumberValidator:\t answer is shorter than custom minimum length`)
}

/**
 * Returns a validation function to check if number length is
 * more than the maximum length specified.
 */
const maxLengthValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<INumberFieldSchema>,
  NumberResponseV3
> = (numberField) => (response) => {
  const { answer } = response
  const { customVal } = numberField.ValidationOptions.LengthValidationOptions
  return !customVal || answer.length <= customVal
    ? right(response)
    : left(`NumberValidator:\t answer is longer than custom maximum length`)
}

/**
 * Returns a validation function to check if number length is
 * equal to the exact length specified.
 */
const exactLengthValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<INumberFieldSchema>,
  NumberResponseV3
> = (numberField) => (response) => {
  const { answer } = response
  const { customVal } = numberField.ValidationOptions.LengthValidationOptions
  return !customVal || answer.length === customVal
    ? right(response)
    : left(`NumberValidator:\t answer does not match custom exact length`)
}

/**
 * Returns the appropriate number length validation function
 * based on the number length validation option selected.
 */
const getNumberLengthValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<INumberFieldSchema>,
  NumberResponseV3
> = (numberField) => {
  switch (
    numberField.ValidationOptions.LengthValidationOptions
      .selectedLengthValidation
  ) {
    // Assume that the validation options are valid (customVal exists).
    case NumberSelectedLengthValidation.Min:
      return minLengthValidatorV3(numberField)
    case NumberSelectedLengthValidation.Max:
      return maxLengthValidatorV3(numberField)
    case NumberSelectedLengthValidation.Exact:
      return exactLengthValidatorV3(numberField)
    default:
      return right
  }
}

/**
 * Returns a validation function to check if number is
 * within the number range specified.
 */
const rangeValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<INumberFieldSchema>,
  NumberResponseV3
> = (numberField) => (response) => {
  // Chained validators ensure that the cast to Number is valid
  const val = Number(response.answer)
  // Assume that the range passed in validation options is valid
  const { customMin, customMax } =
    numberField.ValidationOptions.RangeValidationOptions
  const isWithinMinimum = customMin === null || customMin <= val
  const isWithinMaximum = customMax === null || val <= customMax

  return isWithinMinimum && isWithinMaximum
    ? right(response)
    : left(`NumberValidator:\t answer does not fall within specified range`)
}

/**
 * Returns the appropriate number validation function
 * based on the number validation option selected.
 */
const getNumberValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<INumberFieldSchema>,
  NumberResponseV3
> = (numberField) => {
  switch (numberField.ValidationOptions.selectedValidation) {
    case NumberSelectedValidation.Length:
      return getNumberLengthValidatorV3(numberField)
    case NumberSelectedValidation.Range:
      return rangeValidatorV3(numberField)
    default:
      return right
  }
}

export const constructNumberValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<INumberFieldSchema>,
  ParsedClearFormFieldResponseV3,
  NumberResponseV3
> = (numberField) =>
  flow(
    isNumberResponseV3,
    chain(notEmptySingleAnswerResponseV3),
    chain(numberFormatValidatorV3),
    chain(getNumberValidatorV3(numberField)),
  )
