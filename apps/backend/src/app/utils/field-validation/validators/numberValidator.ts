import { StringAnswerV4 } from '@opengovsg/formsg-sdk'
import {
  BasicField,
  NumberSelectedLengthValidation,
  NumberSelectedValidation,
} from 'formsg-shared/types'
import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { INumberFieldSchema, OmitUnusedValidatorProps } from '../../../../types'
import { ParsedClearFormFieldResponseV4 } from '../../../../types/api'
import {
  ResponseValidator,
  ResponseValidatorConstructor,
} from '../../../../types/field/utils/validation'
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

// V4

type NumberResponseV4 = ParsedClearFormFieldResponseV4 & {
  fieldType: BasicField.Number
  answer: StringAnswerV4
}

const isNumberResponseV4: ResponseValidator<
  ParsedClearFormFieldResponseV4,
  NumberResponseV4
> = (response) => {
  if (response.fieldType !== BasicField.Number) {
    return left(
      'NumberValidatorV4.fieldTypeMismatch:\tfield type is not number',
    )
  }
  return right(response as NumberResponseV4)
}

const notEmptyNumberAnswerV4: ResponseValidator<NumberResponseV4> = (
  response,
) => {
  if (!response.answer.value || response.answer.value.trim().length === 0) {
    return left(
      'NumberValidatorV4.notEmpty:\tanswer is an undefined or empty string',
    )
  }
  return right(response)
}

const numberFormatValidatorV4: ResponseValidator<NumberResponseV4> = (
  response,
) => {
  const { value } = response.answer
  return /^\d*$/.test(value)
    ? right(response)
    : left(`NumberValidatorV4:\t answer is not a valid number format`)
}

const minLengthValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<INumberFieldSchema>,
  NumberResponseV4
> = (numberField) => (response) => {
  const { value } = response.answer
  const { customVal } = numberField.ValidationOptions.LengthValidationOptions
  return !customVal || value.length >= customVal
    ? right(response)
    : left(`NumberValidatorV4:\t answer is shorter than custom minimum length`)
}

const maxLengthValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<INumberFieldSchema>,
  NumberResponseV4
> = (numberField) => (response) => {
  const { value } = response.answer
  const { customVal } = numberField.ValidationOptions.LengthValidationOptions
  return !customVal || value.length <= customVal
    ? right(response)
    : left(`NumberValidatorV4:\t answer is longer than custom maximum length`)
}

const exactLengthValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<INumberFieldSchema>,
  NumberResponseV4
> = (numberField) => (response) => {
  const { value } = response.answer
  const { customVal } = numberField.ValidationOptions.LengthValidationOptions
  return !customVal || value.length === customVal
    ? right(response)
    : left(`NumberValidatorV4:\t answer does not match custom exact length`)
}

const getNumberLengthValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<INumberFieldSchema>,
  NumberResponseV4
> = (numberField) => {
  switch (
    numberField.ValidationOptions.LengthValidationOptions
      .selectedLengthValidation
  ) {
    case NumberSelectedLengthValidation.Min:
      return minLengthValidatorV4(numberField)
    case NumberSelectedLengthValidation.Max:
      return maxLengthValidatorV4(numberField)
    case NumberSelectedLengthValidation.Exact:
      return exactLengthValidatorV4(numberField)
    default:
      return right
  }
}

const rangeValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<INumberFieldSchema>,
  NumberResponseV4
> = (numberField) => (response) => {
  const val = Number(response.answer.value)
  const { customMin, customMax } =
    numberField.ValidationOptions.RangeValidationOptions
  const isWithinMinimum = customMin === null || customMin <= val
  const isWithinMaximum = customMax === null || val <= customMax

  return isWithinMinimum && isWithinMaximum
    ? right(response)
    : left(`NumberValidatorV4:\t answer does not fall within specified range`)
}

const getNumberValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<INumberFieldSchema>,
  NumberResponseV4
> = (numberField) => {
  switch (numberField.ValidationOptions.selectedValidation) {
    case NumberSelectedValidation.Length:
      return getNumberLengthValidatorV4(numberField)
    case NumberSelectedValidation.Range:
      return rangeValidatorV4(numberField)
    default:
      return right
  }
}

export const constructNumberValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<INumberFieldSchema>,
  ParsedClearFormFieldResponseV4,
  NumberResponseV4
> = (numberField) =>
  flow(
    isNumberResponseV4,
    chain(notEmptyNumberAnswerV4),
    chain(numberFormatValidatorV4),
    chain(getNumberValidatorV4(numberField)),
  )
