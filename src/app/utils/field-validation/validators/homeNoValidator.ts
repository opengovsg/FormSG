import { chain, left, right } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'

import { IHomenoField } from 'src/types/field'
import { ResponseValidator } from 'src/types/field/utils/validation'
import { ISingleAnswerResponse } from 'src/types/response'

import {
  isHomePhoneNumber,
  startsWithSgPrefix,
} from '../../../../shared/util/phone-num-validation'

import { notEmptySingleAnswerResponse } from './common'

type HomeNoValidator = ResponseValidator<ISingleAnswerResponse>
type HomeNoValidatorConstructor = (
  homeNumberField: IHomenoField,
) => HomeNoValidator

const homePhoneNumberValidator: HomeNoValidatorConstructor = () => (
  response,
) => {
  return isHomePhoneNumber(response.answer)
    ? right(response)
    : left(`HomeNoValidator:\t answer is not a valid home phone number`)
}

const prefixValidator: HomeNoValidatorConstructor = (homeNumberField) => (
  response,
) => {
  if (
    !homeNumberField.allowIntlNumbers &&
    !startsWithSgPrefix(response.answer)
  ) {
    return left(`HomeNoValidator:\t answer is not an SG number 
        but intl numbers are not allowed`)
  }
  return right(response)
}

export const constructHomeNoValidator: HomeNoValidatorConstructor = (
  homeNumberField,
) => (response) =>
  pipe(
    notEmptySingleAnswerResponse(response),
    chain(homePhoneNumberValidator(homeNumberField)),
    chain(prefixValidator(homeNumberField)),
  )
