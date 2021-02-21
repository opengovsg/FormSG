import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ProcessedSingleAnswerResponse } from 'src/app/modules/submission/submission.types'
import { INumberField } from 'src/types/field'
import { ResponseValidator } from 'src/types/field/utils/validation'

import { NumberSelectedValidation } from '../../../../types/field'

import { notEmptySingleAnswerResponse } from './common'

type NumberValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type NumberValidatorConstructor = (numberField: INumberField) => NumberValidator

/**
 * Validator, to check that answer is an empty string or a nonnegative integer
 */
const numberFormatValidator: NumberValidator = (response) => {
  const { answer } = response
  return /^\d*$/.test(answer)
    ? right(response)
    : left(`NumberValidator:\t answer is not a valid number format`)
}

const minLengthValidator: NumberValidatorConstructor = (numberField) => (
  response,
) => {
  const { answer } = response
  const { customMin } = numberField.ValidationOptions
  return !customMin || answer.length >= customMin
    ? right(response)
    : left(`NumberValidator:\t answer is shorter than custom minimum length`)
}

const maxLengthValidator: NumberValidatorConstructor = (numberField) => (
  response,
) => {
  const { answer } = response
  const { customMax } = numberField.ValidationOptions
  return !customMax || answer.length <= customMax
    ? right(response)
    : left(`NumberValidator:\t answer is longer than custom maximum length`)
}

const exactLengthValidator: NumberValidatorConstructor = (numberField) => (
  response,
) => {
  const { answer } = response
  const { customVal } = numberField.ValidationOptions
  return !customVal || answer.length === customVal
    ? right(response)
    : left(`NumberValidator:\t answer does not match custom exact length`)
}

const getNumberLengthValidator: NumberValidatorConstructor = (numberField) => {
  switch (numberField.ValidationOptions.selectedValidation) {
    case NumberSelectedValidation.Min:
      return minLengthValidator(numberField)
    case NumberSelectedValidation.Max:
      return maxLengthValidator(numberField)
    case NumberSelectedValidation.Exact:
      return exactLengthValidator(numberField)
    default:
      return right
  }
}

export const constructNumberValidator: NumberValidatorConstructor = (
  numberField,
) =>
  flow(
    notEmptySingleAnswerResponse,
    chain(numberFormatValidator),
    chain(getNumberLengthValidator(numberField)),
  )
