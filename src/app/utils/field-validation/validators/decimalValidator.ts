import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import isFloat from 'validator/lib/isFloat'
import isInt from 'validator/lib/isInt'

import { IDecimalField } from 'src/types/field'
import { ResponseValidator } from 'src/types/field/utils/validation'
import { ISingleAnswerResponse } from 'src/types/response'

import { notEmptySingleAnswerResponse } from './common'

type DecimalValidator = ResponseValidator<ISingleAnswerResponse>
type DecimalValidatorConstructor = (
  decimalField: IDecimalField,
) => DecimalValidator

const makeDecimalFloatRangeValidator: DecimalValidatorConstructor = (
  decimalField,
) => (response) => {
  const { customMin, customMax } = decimalField.ValidationOptions || {}
  const { answer } = response
  interface IIsFloatOptions {
    min?: number
    max?: number
  }

  const isFloatOptions: IIsFloatOptions = {}
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

export const constructDecimalValidator: DecimalValidatorConstructor = (
  decimalField,
) =>
  flow(
    notEmptySingleAnswerResponse,
    chain(makeDecimalFloatRangeValidator(decimalField)),
    chain(decimalLeadingPatternValidator),
  )
