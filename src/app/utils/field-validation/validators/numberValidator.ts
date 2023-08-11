import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import {
  NumberSelectedLengthValidation,
  NumberSelectedValidation,
} from '../../../../../shared/types'
import {
  INumberFieldSchema,
  OmitUnusedValidatorProps,
} from '../../../../types/field'
import { ResponseValidator } from '../../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

import { notEmptySingleAnswerResponse } from './common'

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
const getNumberRangeValidator: NumberValidatorConstructor =
  (numberField) => (response) => {
    const val = Number(response.answer)
    const { customMin, customMax } =
      numberField.ValidationOptions.RangeValidationOptions
    const isWithinMinimum = !!customMin && customMin <= val
    const isWithinMaximum = !!customMax && val <= customMax

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
      return getNumberRangeValidator(numberField)
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
