import { chain, left, right } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'

import { ILongTextField, IShortTextField } from 'src/types/field'
import { SingleAnswerResponseValidator } from 'src/types/field/utils/validation'

type textFieldValidatorConstructor = (
  textField: IShortTextField | ILongTextField,
) => SingleAnswerResponseValidator

const requiredValidator: textFieldValidatorConstructor = (textField) => (
  response,
) => {
  if (typeof response.answer !== 'string')
    return left('TextValidator.notString')
  if (textField.required && response.answer.trim().length === 0)
    return left('TextValidator.required')
  return right(response)
}

const minLengthValidator: textFieldValidatorConstructor = (textField) => (
  response,
) => {
  if (typeof response.answer !== 'string')
    return left('TextValidator.notString')
  const { customMin } = textField.ValidationOptions
  const min = customMin !== null ? Number(customMin) : null
  if (min === null) return right(response)
  return response.answer.length >= min
    ? right(response)
    : left(`TextValidator.minLength`)
}

const maxLengthValidator: textFieldValidatorConstructor = (textField) => (
  response,
) => {
  if (typeof response.answer !== 'string')
    return left('TextValidator.notString')
  const { customMax } = textField.ValidationOptions
  const max = customMax !== null ? Number(customMax) : null
  if (max === null) return right(response)
  return response.answer.length <= max
    ? right(response)
    : left(`TextValidator.maxLength`)
}

const exactLengthValidator: textFieldValidatorConstructor = (textField) => (
  response,
) => {
  if (typeof response.answer !== 'string')
    return left('TextValidator.notString')
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
    : left(`TextValidator.exactLength`)
}

const lengthValidator: textFieldValidatorConstructor = (textField) => (
  response,
) => {
  switch (textField.ValidationOptions.selectedValidation) {
    case 'Exact':
      return exactLengthValidator(textField)(response)
    case 'Minimum':
      return minLengthValidator(textField)(response)
    case 'Maximum':
      return maxLengthValidator(textField)(response)
    default:
      return right(response)
  }
}

const constructTextValidator: textFieldValidatorConstructor = (textField) => (
  response,
) => {
  return pipe(
    requiredValidator(textField)(response),
    chain(lengthValidator(textField)),
  )
}

export default constructTextValidator
