import { chain, left, right } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'

import { IMobileField } from 'src/types/field'
import { ResponseValidator } from 'src/types/field/utils/validation'
import { ISingleAnswerResponse } from 'src/types/response'

import {
  isMobilePhoneNumber,
  startsWithSgPrefix,
} from '../../../../shared/util/phone-num-validation'

import { notEmptySingleAnswerResponse } from './common'

type MobileNoValidator = ResponseValidator<ISingleAnswerResponse>
type MobileNoValidatorConstructor = (
  mobileNumberField: IMobileField,
) => MobileNoValidator

const mobilePhoneNumberValidator: MobileNoValidatorConstructor = () => (
  response,
) => {
  return isMobilePhoneNumber(response.answer)
    ? right(response)
    : left(`MobileNoValidator:\t answer is not a valid mobile phone number`)
}

const prefixValidator: MobileNoValidatorConstructor = (mobileNumberField) => (
  response,
) => {
  if (
    !mobileNumberField.allowIntlNumbers &&
    !startsWithSgPrefix(response.answer)
  ) {
    return left(`MobileNoValidator:\t answer is not an SG number 
        but intl numbers are not allowed`)
  }
  return right(response)
}

export const constructMobileNoValidator: MobileNoValidatorConstructor = (
  mobileNumberField,
) => (response) =>
  pipe(
    notEmptySingleAnswerResponse(response),
    chain(mobilePhoneNumberValidator(mobileNumberField)),
    chain(prefixValidator(mobileNumberField)),
  )
