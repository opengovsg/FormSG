import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ProcessedSingleAnswerResponse } from 'src/app/modules/submission/submission.types'
import { IMobileFieldSchema } from 'src/types/field'
import { ResponseValidator } from 'src/types/field/utils/validation'

import formsgSdk from '../../../../config/formsg-sdk'
import {
  isMobilePhoneNumber,
  startsWithSgPrefix,
} from '../../../../shared/util/phone-num-validation'

import { notEmptySingleAnswerResponse } from './common'

type MobileNoValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type MobileNoValidatorConstructor = (
  mobileNumberField: IMobileFieldSchema,
) => MobileNoValidator

const mobilePhoneNumberValidator: MobileNoValidator = (response) => {
  return isMobilePhoneNumber(response.answer)
    ? right(response)
    : left(`MobileNoValidator:\t answer is not a valid mobile phone number`)
}

const sgPrefixValidator: MobileNoValidator = (response) => {
  return startsWithSgPrefix(response.answer)
    ? right(response)
    : left(
        `MobileNoValidator:\t answer is not an SG number but intl numbers are not allowed`,
      )
}

const makePrefixValidator: MobileNoValidatorConstructor = (
  mobileNumberField,
) => {
  return mobileNumberField.allowIntlNumbers ? right : sgPrefixValidator
}

const makeMobileSignatureValidator: MobileNoValidatorConstructor = (
  mobileNumberField,
) => (response) => {
  const { isVerifiable, _id } = mobileNumberField
  if (!isVerifiable) {
    return right(response) // no validation occurred
  }
  const { signature, answer } = response
  if (!signature) {
    return left(`MobileNoValidator:\t answer does not have valid signature`)
  }
  const isSigned =
    formsgSdk.verification.authenticate &&
    formsgSdk.verification.authenticate({
      signatureString: signature,
      submissionCreatedAt: Date.now(),
      fieldId: _id,
      answer,
    })

  return isSigned
    ? right(response)
    : left(`MobileNoValidator:\t answer does not have valid signature`)
}

export const constructMobileNoValidator: MobileNoValidatorConstructor = (
  mobileNumberField,
) =>
  flow(
    notEmptySingleAnswerResponse,
    chain(mobilePhoneNumberValidator),
    chain(makeMobileSignatureValidator(mobileNumberField)),
    chain(makePrefixValidator(mobileNumberField)),
  )
