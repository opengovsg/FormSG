import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ProcessedSingleAnswerResponse } from 'src/modules/submission/submission.types'
import {
  ILongTextField,
  IShortTextField,
  TextSelectedValidation,
} from 'src/types/field'
import { ResponseValidator } from 'src/types/field/utils/validation'

import { notEmptySingleAnswerResponse } from './common'

type TextFieldValidatorConstructor = (
  textField: IShortTextField | ILongTextField,
) => ResponseValidator<ProcessedSingleAnswerResponse>

/**
 * Returns a validator to check if
 * text length is less than the min length specified.
 */
const minLengthValidator: TextFieldValidatorConstructor = (textField) => (
  response,
) => {
  const { customMin } = textField.ValidationOptions
  const min = customMin !== null ? Number(customMin) : null
  if (min === null) return right(response)
  return response.answer.length >= min
    ? right(response)
    : left(`TextValidator.minLength:\tanswer is less than minimum of ${min}`)
}

/**
 * Returns a validator to check if
 * text length is more than the max length specified.
 */
const maxLengthValidator: TextFieldValidatorConstructor = (textField) => (
  response,
) => {
  const { customMax } = textField.ValidationOptions
  const max = customMax !== null ? Number(customMax) : null
  if (max === null) return right(response)
  return response.answer.length <= max
    ? right(response)
    : left(`TextValidator.maxLength:\tanswer is greater than maximum of ${max}`)
}

/**
 * Returns a validator to check if
 * text length is the exact length specified.
 */
const exactLengthValidator: TextFieldValidatorConstructor = (textField) => (
  response,
) => {
  const { customMin, customMax } = textField.ValidationOptions
  const exact =
    customMin !== null
      ? Number(customMin)
      : customMax !== null
      ? Number(customMax)
      : null
  if (exact === null) return right(response)
  return response.answer.length === exact
    ? right(response)
    : left(
        `TextValidator.exactLength:\tanswer is not exactly equal to ${exact}`,
      )
}

/**
 * Returns the appropriate validator
 * based on the text length validation option selected.
 */
const getLengthValidator: TextFieldValidatorConstructor = (textField) => {
  switch (textField.ValidationOptions.selectedValidation) {
    case TextSelectedValidation.Exact:
      return exactLengthValidator(textField)
    case TextSelectedValidation.Minimum:
      return minLengthValidator(textField)
    case TextSelectedValidation.Maximum:
      return maxLengthValidator(textField)
    default:
      return right
  }
}

/**
 * Returns a validation function for a text field when called.
 */
const constructTextValidator: TextFieldValidatorConstructor = (textField) => {
  return flow(
    notEmptySingleAnswerResponse,
    chain(getLengthValidator(textField)),
  )
}

export default constructTextValidator
