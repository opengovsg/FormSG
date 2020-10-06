import { chain, left, right } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'

import { ILongTextField, IShortTextField } from 'src/types/field'
import { TextValidationOptions } from 'src/types/field/baseField'
import { ResponseValidator } from 'src/types/field/utils/validation'
import { ISingleAnswerResponse } from 'src/types/response'

import { notEmptySingleAnswerResponse } from './common'

type TextFieldValidatorConstructor = (
  textField: IShortTextField | ILongTextField,
) => ResponseValidator<ISingleAnswerResponse>

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

const lengthValidator: TextFieldValidatorConstructor = (textField) => (
  response,
) => {
  switch (textField.ValidationOptions.selectedValidation) {
    case TextValidationOptions.Exact:
      return exactLengthValidator(textField)(response)
    case TextValidationOptions.Minimum:
      return minLengthValidator(textField)(response)
    case TextValidationOptions.Maximum:
      return maxLengthValidator(textField)(response)
    default:
      return right(response)
  }
}

const constructTextValidator: TextFieldValidatorConstructor = (textField) => (
  response,
) => {
  return pipe(
    notEmptySingleAnswerResponse(response),
    chain(lengthValidator(textField)),
  )
}

export default constructTextValidator
