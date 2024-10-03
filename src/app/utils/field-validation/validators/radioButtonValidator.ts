import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import { BasicField } from 'shared/types'
import { RadioResponseV3 } from 'shared/types/response-v3'

import { ParsedClearFormFieldResponseV3 } from '../../../../types/api'
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
    ('othersInput' in answer &&
      !isOtherOption(othersRadioButton, answer.othersInput))

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
    chain(isRadioAnsweEmptyV3),
    chain(makeIsRadioOptionValidatorV3(formField)),
  )
