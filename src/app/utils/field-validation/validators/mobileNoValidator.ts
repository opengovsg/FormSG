import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { BasicField, MobileResponseV3 } from '../../../../../shared/types'
import {
  isMobilePhoneNumber,
  startsWithSgPrefix,
} from '../../../../../shared/utils/phone-num-validation'
import { ParsedClearFormFieldResponseV3 } from '../../../../types/api'
import {
  IMobileFieldSchema,
  OmitUnusedValidatorProps,
} from '../../../../types/field'
import {
  ResponseValidator,
  ResponseValidatorConstructor,
} from '../../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

import {
  makeSignatureValidator,
  makeSignatureValidatorV3,
  notEmptySingleAnswerResponse,
  notEmptyVerifiableAnswerResponseV3,
} from './common'

type MobileNoValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type MobileNoValidatorConstructor = (
  mobileNumberField: OmitUnusedValidatorProps<IMobileFieldSchema>,
) => MobileNoValidator

/**
 * Returns a validator to check if mobile
 * number format is correct.
 */
const mobilePhoneNumberValidator: MobileNoValidator = (response) => {
  return isMobilePhoneNumber(response.answer)
    ? right(response)
    : left(`MobileNoValidator:\t answer is not a valid mobile phone number`)
}

/**
 * Returns a validator to check if mobile
 * number starts with singapore prefix.
 */
const sgPrefixValidator: MobileNoValidator = (response) => {
  return startsWithSgPrefix(response.answer)
    ? right(response)
    : left(
        `MobileNoValidator:\t answer is not an SG number but intl numbers are not allowed`,
      )
}

/**
 * Returns a validator to check if mobile
 * number prefix is correct.
 */
const makePrefixValidator: MobileNoValidatorConstructor = (
  mobileNumberField,
) => {
  return mobileNumberField.allowIntlNumbers ? right : sgPrefixValidator
}

/**
 * Constructs validator for mobile number field.
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

const isMobileResponseV3: ResponseValidator<
  ParsedClearFormFieldResponseV3,
  MobileResponseV3
> = (response) => {
  if (response.fieldType !== BasicField.Mobile) {
    return left(`MobileValidatorV3.fieldTypeMismatch:\tfieldType is not mobile`)
  }
  return right(response)
}

/**
 * Returns a validator to check if mobile
 * number format is correct.
 */
const mobilePhoneNumberValidatorV3: ResponseValidator<MobileResponseV3> = (
  response,
) => {
  return isMobilePhoneNumber(response.answer.value)
    ? right(response)
    : left(`MobileNoValidatorV3:\t answer is not a valid mobile phone number`)
}

/**
 * Returns a validator to check if mobile
 * number starts with singapore prefix.
 */
const sgPrefixValidatorV3: ResponseValidator<MobileResponseV3> = (response) => {
  return startsWithSgPrefix(response.answer.value)
    ? right(response)
    : left(
        `MobileNoValidatorV3:\t answer is not an SG number but intl numbers are not allowed`,
      )
}

/**
 * Returns a validator to check if mobile
 * number prefix is correct.
 */
const makePrefixValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IMobileFieldSchema>,
  MobileResponseV3
> = (mobileNumberField) => {
  return mobileNumberField.allowIntlNumbers ? right : sgPrefixValidatorV3
}

export const constructMobileNoValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IMobileFieldSchema>,
  ParsedClearFormFieldResponseV3,
  MobileResponseV3
> = (mobileNumberField) =>
  flow(
    isMobileResponseV3,
    chain(notEmptyVerifiableAnswerResponseV3),
    chain(mobilePhoneNumberValidatorV3),
    chain(makeSignatureValidatorV3(mobileNumberField)),
    chain(makePrefixValidatorV3(mobileNumberField)),
  )
