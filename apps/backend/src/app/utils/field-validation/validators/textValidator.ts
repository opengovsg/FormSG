import { StringAnswerV4 } from '@opengovsg/formsg-sdk'
import {
  BasicField,
  LongTextResponseV3,
  ShortTextResponseV3,
  TextSelectedValidation,
} from 'formsg-shared/types'
import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import {
  ParsedClearFormFieldResponseV3,
  ParsedClearFormFieldResponseV4,
} from '../../../../types/api'
import {
  ILongTextFieldSchema,
  IShortTextFieldSchema,
  OmitUnusedValidatorProps,
} from '../../../../types/field'
import {
  ResponseValidator,
  ResponseValidatorConstructor,
} from '../../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

import {
  notEmptySingleAnswerResponse,
  notEmptySingleAnswerResponseV3,
} from './common'

type TextFieldValidatorConstructor = (
  textField:
    | OmitUnusedValidatorProps<IShortTextFieldSchema>
    | OmitUnusedValidatorProps<ILongTextFieldSchema>,
) => ResponseValidator<ProcessedSingleAnswerResponse>

/**
 * Returns a validator to check if
 * text length is less than the min length specified.
 */
const minLengthValidator: TextFieldValidatorConstructor =
  (textField) => (response) => {
    const { customVal: min } = textField.ValidationOptions
    if (min === null) return right(response)
    return response.answer.length >= (min || 0)
      ? right(response)
      : left(`TextValidator.minLength:\tanswer is less than minimum of ${min}`)
  }

/**
 * Returns a validator to check if
 * text length is more than the max length specified.
 */
const maxLengthValidator: TextFieldValidatorConstructor =
  (textField) => (response) => {
    const { customVal: max } = textField.ValidationOptions
    if (max === null) return right(response)
    return response.answer.length <= (max || 0)
      ? right(response)
      : left(
          `TextValidator.maxLength:\tanswer is greater than maximum of ${max}`,
        )
  }

/**
 * Returns a validator to check if
 * text length is the exact length specified.
 */
const exactLengthValidator: TextFieldValidatorConstructor =
  (textField) => (response) => {
    const { customVal: exact } = textField.ValidationOptions
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

const isTextFieldV3: ResponseValidator<
  ParsedClearFormFieldResponseV3,
  ShortTextResponseV3 | LongTextResponseV3
> = (response) => {
  if (
    response.fieldType === BasicField.ShortText ||
    response.fieldType === BasicField.LongText
  ) {
    return right(response)
  }
  return left(
    `TextValidatorV3.fieldTypeMismatch:\tfield type is not textfield or textarea`,
  )
}

/**
 * Returns a validator to check if
 * text length is less than the min length specified.
 */
const minLengthValidatorV3: ResponseValidatorConstructor<
  | OmitUnusedValidatorProps<IShortTextFieldSchema>
  | OmitUnusedValidatorProps<ILongTextFieldSchema>,
  ShortTextResponseV3 | LongTextResponseV3
> = (textField) => (response) => {
  const { customVal: min } = textField.ValidationOptions
  if (min === null) return right(response)
  return response.answer.length >= (min || 0)
    ? right(response)
    : left(`TextValidatorV3.minLength:\tanswer is less than minimum of ${min}`)
}

/**
 * Returns a validator to check if
 * text length is more than the max length specified.
 */
const maxLengthValidatorV3: ResponseValidatorConstructor<
  | OmitUnusedValidatorProps<IShortTextFieldSchema>
  | OmitUnusedValidatorProps<ILongTextFieldSchema>,
  ShortTextResponseV3 | LongTextResponseV3
> = (textField) => (response) => {
  const { customVal: max } = textField.ValidationOptions
  if (max === null) return right(response)
  return response.answer.length <= (max || 0)
    ? right(response)
    : left(
        `TextValidatorV3.maxLength:\tanswer is greater than maximum of ${max}`,
      )
}

/**
 * Returns a validator to check if
 * text length is the exact length specified.
 */
const exactLengthValidatorV3: ResponseValidatorConstructor<
  | OmitUnusedValidatorProps<IShortTextFieldSchema>
  | OmitUnusedValidatorProps<ILongTextFieldSchema>,
  ShortTextResponseV3 | LongTextResponseV3
> = (textField) => (response) => {
  const { customVal: exact } = textField.ValidationOptions
  if (exact === null) return right(response)
  return response.answer.length === exact
    ? right(response)
    : left(
        `TextValidatorV3.exactLength:\tanswer is not exactly equal to ${exact}`,
      )
}

/**
 * Returns the appropriate validator
 * based on the text length validation option selected.
 */
const makeLengthValidatorV3: ResponseValidatorConstructor<
  | OmitUnusedValidatorProps<IShortTextFieldSchema>
  | OmitUnusedValidatorProps<ILongTextFieldSchema>,
  ShortTextResponseV3 | LongTextResponseV3
> = (textField) => {
  switch (textField.ValidationOptions.selectedValidation) {
    case TextSelectedValidation.Exact:
      return exactLengthValidatorV3(textField)
    case TextSelectedValidation.Minimum:
      return minLengthValidatorV3(textField)
    case TextSelectedValidation.Maximum:
      return maxLengthValidatorV3(textField)
    default:
      return right
  }
}

export const constructTextValidatorV3: ResponseValidatorConstructor<
  | OmitUnusedValidatorProps<IShortTextFieldSchema>
  | OmitUnusedValidatorProps<ILongTextFieldSchema>,
  ParsedClearFormFieldResponseV3,
  ShortTextResponseV3 | LongTextResponseV3
> = (textField) =>
  flow(
    isTextFieldV3,
    chain(notEmptySingleAnswerResponseV3),
    chain(makeLengthValidatorV3(textField)),
  )

// V4

type TextResponseV4 = ParsedClearFormFieldResponseV4 & {
  fieldType: BasicField.ShortText | BasicField.LongText
  answer: StringAnswerV4
}

const isTextFieldV4: ResponseValidator<
  ParsedClearFormFieldResponseV4,
  TextResponseV4
> = (response) => {
  if (
    response.fieldType === BasicField.ShortText ||
    response.fieldType === BasicField.LongText
  ) {
    return right(response as TextResponseV4)
  }
  return left(
    `TextValidatorV4.fieldTypeMismatch:\tfield type is not textfield or textarea`,
  )
}

const notEmptyTextAnswerV4: ResponseValidator<TextResponseV4> = (response) => {
  if (!response.answer.value || response.answer.value.trim().length === 0) {
    return left(
      'TextValidatorV4.notEmpty:\tanswer is an undefined or empty string',
    )
  }
  return right(response)
}

const minLengthValidatorV4: ResponseValidatorConstructor<
  | OmitUnusedValidatorProps<IShortTextFieldSchema>
  | OmitUnusedValidatorProps<ILongTextFieldSchema>,
  TextResponseV4
> = (textField) => (response) => {
  const { customVal: min } = textField.ValidationOptions
  if (min === null) return right(response)
  return response.answer.value.length >= (min || 0)
    ? right(response)
    : left(`TextValidatorV4.minLength:\tanswer is less than minimum of ${min}`)
}

const maxLengthValidatorV4: ResponseValidatorConstructor<
  | OmitUnusedValidatorProps<IShortTextFieldSchema>
  | OmitUnusedValidatorProps<ILongTextFieldSchema>,
  TextResponseV4
> = (textField) => (response) => {
  const { customVal: max } = textField.ValidationOptions
  if (max === null) return right(response)
  return response.answer.value.length <= (max || 0)
    ? right(response)
    : left(
        `TextValidatorV4.maxLength:\tanswer is greater than maximum of ${max}`,
      )
}

const exactLengthValidatorV4: ResponseValidatorConstructor<
  | OmitUnusedValidatorProps<IShortTextFieldSchema>
  | OmitUnusedValidatorProps<ILongTextFieldSchema>,
  TextResponseV4
> = (textField) => (response) => {
  const { customVal: exact } = textField.ValidationOptions
  if (exact === null) return right(response)
  return response.answer.value.length === exact
    ? right(response)
    : left(
        `TextValidatorV4.exactLength:\tanswer is not exactly equal to ${exact}`,
      )
}

const makeLengthValidatorV4: ResponseValidatorConstructor<
  | OmitUnusedValidatorProps<IShortTextFieldSchema>
  | OmitUnusedValidatorProps<ILongTextFieldSchema>,
  TextResponseV4
> = (textField) => {
  switch (textField.ValidationOptions.selectedValidation) {
    case TextSelectedValidation.Exact:
      return exactLengthValidatorV4(textField)
    case TextSelectedValidation.Minimum:
      return minLengthValidatorV4(textField)
    case TextSelectedValidation.Maximum:
      return maxLengthValidatorV4(textField)
    default:
      return right
  }
}

export const constructTextValidatorV4: ResponseValidatorConstructor<
  | OmitUnusedValidatorProps<IShortTextFieldSchema>
  | OmitUnusedValidatorProps<ILongTextFieldSchema>,
  ParsedClearFormFieldResponseV4,
  TextResponseV4
> = (textField) =>
  flow(
    isTextFieldV4,
    chain(notEmptyTextAnswerV4),
    chain(makeLengthValidatorV4(textField)),
  )
