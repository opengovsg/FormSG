import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { BasicField, HomeNoResponseV3 } from '../../../../../shared/types'
import {
  isHomePhoneNumber,
  startsWithSgPrefix,
} from '../../../../../shared/utils/phone-num-validation'
import { ParsedClearFormFieldResponseV3 } from '../../../../types/api'
import {
  IHomenoFieldSchema,
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

type HomeNoValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type HomeNoValidatorConstructor = (
  homeNumberField: OmitUnusedValidatorProps<IHomenoFieldSchema>,
) => HomeNoValidator

/**
 * Returns a validator to check if home number
 * format is correct.
 */
const homePhoneNumberValidator: HomeNoValidator = (response) => {
  return isHomePhoneNumber(response.answer)
    ? right(response)
    : left(`HomeNoValidator:\t answer is not a valid home phone number`)
}

/**
 * Returns a validator to check if home
 * number starts with singapore prefix.
 */
const sgPrefixValidator: HomeNoValidator = (response) => {
  return startsWithSgPrefix(response.answer)
    ? right(response)
    : left(
        `HomeNoValidator:\t answer is not an SG number but intl numbers are not allowed`,
      )
}

/**
 * Returns a validation function to check if home
 * number prefix is correct.
 */
const makePrefixValidator: HomeNoValidatorConstructor = (homeNumberField) => {
  return homeNumberField.allowIntlNumbers ? right : sgPrefixValidator
}

/**
 * Returns a validation function for a home number field when called.
 */
export const constructHomeNoValidator: HomeNoValidatorConstructor = (
  homeNumberField,
) =>
  flow(
    notEmptySingleAnswerResponse,
    chain(homePhoneNumberValidator),
    chain(makePrefixValidator(homeNumberField)),
  )

const isHomePhoneNumberV3: ResponseValidator<
  ParsedClearFormFieldResponseV3,
  HomeNoResponseV3
> = (response) => {
  if (response.fieldType !== BasicField.HomeNo) {
    return left(
      'HomeNoValidatorV3.fieldTypeMismatch:\t fieldType is not homeno',
    )
  }
  return right(response)
}

/**
 * Returns a validator to check if home number
 * format is correct.
 */
const homePhoneNumberValidatorV3: ResponseValidator<HomeNoResponseV3> = (
  response,
) => {
  return isHomePhoneNumber(response.answer)
    ? right(response)
    : left(`HomeNoValidator:\t answer is not a valid home phone number`)
}

/**
 * Returns a validator to check if home
 * number starts with singapore prefix.
 */
const sgPrefixValidatorV3: ResponseValidator<HomeNoResponseV3> = (response) => {
  return startsWithSgPrefix(response.answer)
    ? right(response)
    : left(
        `HomeNoValidator:\t answer is not an SG number but intl numbers are not allowed`,
      )
}

/**
 * Returns a validation function to check if home
 * number prefix is correct.
 */
const makePrefixValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IHomenoFieldSchema>,
  HomeNoResponseV3
> = (homeNumberField) => {
  return homeNumberField.allowIntlNumbers ? right : sgPrefixValidatorV3
}

export const constructHomeNoValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IHomenoFieldSchema>,
  ParsedClearFormFieldResponseV3,
  HomeNoResponseV3
> = (formField) =>
  flow(
    isHomePhoneNumberV3,
    chain(notEmptySingleAnswerResponseV3),
    chain(homePhoneNumberValidatorV3),
    chain(makePrefixValidatorV3(formField)),
  )
