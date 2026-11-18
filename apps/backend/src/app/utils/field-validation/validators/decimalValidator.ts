import { StringAnswerV4 } from '@opengovsg/formsg-sdk'
import { BasicField } from 'formsg-shared/types'
import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import isFloat from 'validator/lib/isFloat'
import isInt from 'validator/lib/isInt'

import { ParsedClearFormFieldResponseV4 } from '../../../../types/api'
import {
  IDecimalFieldSchema,
  OmitUnusedValidatorProps,
} from '../../../../types/field'
import {
  ResponseValidator,
  ResponseValidatorConstructor,
} from '../../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

import { notEmptySingleAnswerResponse } from './common'

type DecimalValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type DecimalValidatorConstructor = (
  decimalField: OmitUnusedValidatorProps<IDecimalFieldSchema>,
) => DecimalValidator
interface IIsFloatOptions {
  min?: number
  max?: number
}

/**
 * Returns a validation function
 * to check if decimal is within the specified custom range.
 */
const makeDecimalFloatRangeValidator: DecimalValidatorConstructor =
  (decimalField) => (response) => {
    const { customMin, customMax } = decimalField.ValidationOptions // defaults to customMin: null, customMax: null
    const { answer } = response

    const isFloatOptions: IIsFloatOptions = {}
    // Necessary to add 'min' and 'max' property manually as
    // isFloatOptions tests for presence of property
    // See https://github.com/validatorjs/validator.js/blob/302d2957c924b515cb22f7e87b5e84fee8636d6e/src/lib/isFloat.js#L13

    if (customMin || customMin === 0) {
      isFloatOptions['min'] = customMin
    }
    if (customMax || customMax === 0) {
      isFloatOptions['max'] = customMax
    }

    // isFloat validates range correctly for floats up to 15 decimal places
    // (1.999999999999999 >= 2) is False
    // (1.9999999999999999 >= 2) is True
    return isFloat(answer, isFloatOptions)
      ? right(response)
      : left(`DecimalValidator:\t answer is not a valid float`)
  }

/**
 * Returns a validator to check if
 * decimal has correct leading pattern
 */
const decimalLeadingPatternValidator: DecimalValidator = (response) => {
  const { answer } = response

  // leading number cannot be empty (".1") and no leading zeroes ("001")
  const isLeadingPatternValid = isInt(answer.split('.')[0], {
    allow_leading_zeroes: false,
  })

  return isLeadingPatternValid
    ? right(response)
    : left(`DecimalValidator:\t answer has invalid leading pattern`)
}

/**
 * Returns a validation function for a decimal field when called.
 */
export const constructDecimalValidator: DecimalValidatorConstructor = (
  decimalField,
) =>
  flow(
    notEmptySingleAnswerResponse,
    chain(makeDecimalFloatRangeValidator(decimalField)),
    chain(decimalLeadingPatternValidator),
  )

// V4

type DecimalResponseV4 = ParsedClearFormFieldResponseV4 & {
  fieldType: BasicField.Decimal
  answer: StringAnswerV4
}

const isDecimalFieldV4: ResponseValidator<
  ParsedClearFormFieldResponseV4,
  DecimalResponseV4
> = (response) => {
  if (response.fieldType !== BasicField.Decimal) {
    return left(
      'DecimalValidatorV4.fieldTypeMismatch:\tfield type is not decimal',
    )
  }
  return right(response as DecimalResponseV4)
}

const notEmptyDecimalAnswerV4: ResponseValidator<DecimalResponseV4> = (
  response,
) => {
  if (!response.answer.value || response.answer.value.trim().length === 0) {
    return left(
      'DecimalValidatorV4.notEmpty:\tanswer is an undefined or empty string',
    )
  }
  return right(response)
}

const makeDecimalFloatRangeValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IDecimalFieldSchema>,
  DecimalResponseV4
> = (decimalField) => (response) => {
  const { customMin, customMax } = decimalField.ValidationOptions
  const { value } = response.answer

  const isFloatOptions: IIsFloatOptions = {}

  if (customMin || customMin === 0) {
    isFloatOptions['min'] = customMin
  }
  if (customMax || customMax === 0) {
    isFloatOptions['max'] = customMax
  }

  return isFloat(value, isFloatOptions)
    ? right(response)
    : left(`DecimalValidatorV4:\t answer is not a valid float`)
}

const decimalLeadingPatternValidatorV4: ResponseValidator<DecimalResponseV4> = (
  response,
) => {
  const { value } = response.answer

  const isLeadingPatternValid = isInt(value.split('.')[0], {
    allow_leading_zeroes: false,
  })

  return isLeadingPatternValid
    ? right(response)
    : left(`DecimalValidatorV4:\t answer has invalid leading pattern`)
}

export const constructDecimalValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IDecimalFieldSchema>,
  ParsedClearFormFieldResponseV4,
  DecimalResponseV4
> = (decimalField) =>
  flow(
    isDecimalFieldV4,
    chain(notEmptyDecimalAnswerV4),
    chain(makeDecimalFloatRangeValidatorV4(decimalField)),
    chain(decimalLeadingPatternValidatorV4),
  )
