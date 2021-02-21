import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ProcessedSingleAnswerResponse } from 'src/app/modules/submission/submission.types'
import { IMobileFieldSchema } from 'src/types/field'
import { ResponseValidator } from 'src/types/field/utils/validation'

import {
  isMobilePhoneNumber,
  startsWithSgPrefix,
} from '../../../../shared/util/phone-num-validation'

import { makeSignatureValidator, notEmptySingleAnswerResponse } from './common'

type MobileNoValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type MobileNoValidatorConstructor = (
  mobileNumberField: IMobileFieldSchema,
) => MobileNoValidator

/**
 * A function that returns a validator to check if home
 * number format is correct
 */
const mobilePhoneNumberValidator: MobileNoValidator = (response) => {
  return isMobilePhoneNumber(response.answer)
    ? right(response)
    : left(`MobileNoValidator:\t answer is not a valid mobile phone number`)
}

/**
 * A function that returns a validator to check if mobile
 * number starts with singapore prefix
 */
const sgPrefixValidator: MobileNoValidator = (response) => {
  return startsWithSgPrefix(response.answer)
    ? right(response)
    : left(
        `MobileNoValidator:\t answer is not an SG number but intl numbers are not allowed`,
      )
}

/**
 * A function that returns a validator to check if mobile
 * number prefix is correct
 */
const makePrefixValidator: MobileNoValidatorConstructor = (
  mobileNumberField,
) => {
  return mobileNumberField.allowIntlNumbers ? right : sgPrefixValidator
}

/**
 * Constructs validator for mobile number field
 */
export const constructMobileNoValidator: MobileNoValidatorConstructor = (
  mobileNumberField,
) =>
  flow(
    notEmptySingleAnswerResponse,
    chain(mobilePhoneNumberValidator),
    chain(makeSignatureValidator(mobileNumberField)),
    chain(makePrefixValidator(mobileNumberField)),
  )
