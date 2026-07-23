import { RadioAnswerV4 } from '@opengovsg/formsg-sdk'
import { BasicField, RadioResponseV3 } from 'formsg-shared/types'
import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import {
  ParsedClearFormFieldResponseV3,
  ParsedClearFormFieldResponseV4,
} from '../../../../types/api'
import {
  IRadioFieldSchema,
  OmitUnusedValidatorProps,
} from '../../../../types/field'
import {
  ResponseValidator,
  ResponseValidatorConstructor,
} from '../../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

import { notEmptySingleAnswerResponse } from './common'
import { isOneOfOptions, isOtherOption } from './options'

type RadioButtonValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type RadioButtonValidatorConstructor = (
  radioButtonField: OmitUnusedValidatorProps<IRadioFieldSchema>,
) => RadioButtonValidator

/**
 * Returns a validation function to check if the
 * selected radio option is one of the specified options.
 */
const makeRadioOptionsValidator: RadioButtonValidatorConstructor =
  (radioButtonField) => (response) => {
    const { answer } = response
    const { fieldOptions, othersRadioButton } = radioButtonField
    const isValid =
      isOneOfOptions(fieldOptions, answer) ||
      isOtherOption(othersRadioButton, answer)

    return isValid
      ? right(response)
      : left(`RadioButtonValidator:\tanswer is not a valid radio button option`)
  }

/**
 * Returns a validation function for a radio button field when called.
 */
export const constructRadioButtonValidator: RadioButtonValidatorConstructor = (
  radioButtonField,
) =>
  flow(
    notEmptySingleAnswerResponse,
    chain(makeRadioOptionsValidator(radioButtonField)),
  )

const isRadioFieldTypeV3: ResponseValidator<
  ParsedClearFormFieldResponseV3,
  RadioResponseV3
> = (response) => {
  if (response.fieldType !== BasicField.Radio) {
    return left(
      'RadioButtonValidatorV3.fieldTypeMismatch:\tfield type is not radio',
    )
  }
  return right(response)
}

const isEitherOthersInputOrValueExistV3: ResponseValidator<RadioResponseV3> = (
  response,
) => {
  if ('value' in response.answer && 'othersInput' in response.answer) {
    return left(
      'RadioButtonValidatorV3.valueAndOthersInputExist:\tanswer should only contain one of value or othersInputs',
    )
  }
  return right(response)
}

export const isRadioAnsweEmptyV3: ResponseValidator<RadioResponseV3> = (
  response,
) => {
  if (
    ('value' in response.answer && response.answer.value.trim().length === 0) ||
    ('othersInput' in response.answer &&
      response.answer.othersInput.trim().length === 0)
  ) {
    return left('RadioButtonValidatorV3.valueEmpty:\tanswer is empty')
  }
  return right(response)
}

/**
 * Returns a validation function to check if the
 * selected radio option is one of the specified options.
 */
const makeIsRadioOptionValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IRadioFieldSchema>,
  RadioResponseV3
> = (radioButtonField) => (response) => {
  const { answer } = response
  const { fieldOptions, othersRadioButton } = radioButtonField

  const isInvalid =
    ('value' in answer && !isOneOfOptions(fieldOptions, answer.value)) ||
    (!othersRadioButton && 'othersInput' in answer)
  if (isInvalid) {
    return left(
      `RadioButtonValidatorV3:\tanswer is not a valid radio button option`,
    )
  }

  return right(response)
}

export const constructRadioButtonValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IRadioFieldSchema>,
  ParsedClearFormFieldResponseV3,
  RadioResponseV3
> = (formField) =>
  flow(
    isRadioFieldTypeV3,
    chain(isEitherOthersInputOrValueExistV3),
    chain(isRadioAnsweEmptyV3),
    chain(makeIsRadioOptionValidatorV3(formField)),
  )

// V4
// V4 radio: answer = { value: string, isOthersInput: boolean }
// value contains either a fieldOption label or the user's "others" text
// isOthersInput indicates whether it's an "others" input

type RadioResponseV4 = ParsedClearFormFieldResponseV4 & {
  fieldType: BasicField.Radio
  answer: RadioAnswerV4
}

const isRadioFieldTypeV4: ResponseValidator<
  ParsedClearFormFieldResponseV4,
  RadioResponseV4
> = (response) => {
  if (response.fieldType !== BasicField.Radio) {
    return left(
      'RadioButtonValidatorV4.fieldTypeMismatch:\tfield type is not radio',
    )
  }
  return right(response as RadioResponseV4)
}

const isRadioAnswerEmptyV4: ResponseValidator<RadioResponseV4> = (response) => {
  if (response.answer.value.trim().length === 0) {
    return left('RadioButtonValidatorV4.valueEmpty:\tanswer value is empty')
  }
  return right(response)
}

const makeIsRadioOptionValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IRadioFieldSchema>,
  RadioResponseV4
> = (radioButtonField) => (response) => {
  const { answer } = response
  const { fieldOptions, othersRadioButton } = radioButtonField

  if (answer.isOthersInput) {
    // If isOthersInput is true, others must be enabled
    if (!othersRadioButton) {
      return left(
        `RadioButtonValidatorV4:\tanswer is not a valid radio button option`,
      )
    }
    return right(response)
  }

  // Not others input — value must be one of the fieldOptions
  const isValid = isOneOfOptions(fieldOptions, answer.value)
  return isValid
    ? right(response)
    : left(`RadioButtonValidatorV4:\tanswer is not a valid radio button option`)
}

export const constructRadioButtonValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IRadioFieldSchema>,
  ParsedClearFormFieldResponseV4,
  RadioResponseV4
> = (formField) =>
  flow(
    isRadioFieldTypeV4,
    chain(isRadioAnswerEmptyV4),
    chain(makeIsRadioOptionValidatorV4(formField)),
  )
