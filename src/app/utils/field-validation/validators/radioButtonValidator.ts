import { chain, left, right } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'

import { IRadioField } from 'src/types/field'
import { ResponseValidator } from 'src/types/field/utils/validation'
import { ISingleAnswerResponse } from 'src/types/response'

import { notEmptySingleAnswerResponse } from './common'
import { isOneOfOptions, isOtherOption } from './options'

type RadioButtonValidator = ResponseValidator<ISingleAnswerResponse>
type RadioButtonValidatorConstructor = (
  radioButtonField: IRadioField,
) => RadioButtonValidator

const radioButtonValidator: RadioButtonValidatorConstructor = (
  radioButtonField,
) => (response) => {
  const { answer } = response
  const { fieldOptions, othersRadioButton } = radioButtonField
  const isValid =
    isOneOfOptions(fieldOptions, answer) ||
    isOtherOption(othersRadioButton, answer)

  return isValid
    ? right(response)
    : left(`RadioButtonValidator:\tanswer is not a valid radio button option`)
}

export const constructRadioButtonValidator: RadioButtonValidatorConstructor = (
  radioButtonField,
) => (response) =>
  pipe(
    notEmptySingleAnswerResponse(response),
    chain(radioButtonValidator(radioButtonField)),
  )
