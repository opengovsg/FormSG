import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ProcessedSingleAnswerResponse } from 'src/app/modules/submission/submission.types'
import { IHomenoField } from 'src/types/field'
import { ResponseValidator } from 'src/types/field/utils/validation'

import {
  isHomePhoneNumber,
  startsWithSgPrefix,
} from '../../../../shared/util/phone-num-validation'

import { notEmptySingleAnswerResponse } from './common'

type HomeNoValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type HomeNoValidatorConstructor = (
  homeNumberField: IHomenoField,
) => HomeNoValidator

/**
 * A function that returns a validator to check if home number
 * format is correct
 */
const homePhoneNumberValidator: HomeNoValidator = (response) => {
  return isHomePhoneNumber(response.answer)
    ? right(response)
    : left(`HomeNoValidator:\t answer is not a valid home phone number`)
}

/**
 * A function that returns a validator to check if home
 * number starts with singapore prefix
 */
const sgPrefixValidator: HomeNoValidator = (response) => {
  return startsWithSgPrefix(response.answer)
    ? right(response)
    : left(
        `HomeNoValidator:\t answer is not an SG number but intl numbers are not allowed`,
      )
}

/**
 * A function that returns a validation function to check if home
 * number prefix is correct
 */
const makePrefixValidator: HomeNoValidatorConstructor = (homeNumberField) => {
  return homeNumberField.allowIntlNumbers ? right : sgPrefixValidator
}

/**
 * A function that returns a validation function for a home number field when called.
 */
export const constructHomeNoValidator: HomeNoValidatorConstructor = (
  homeNumberField,
) =>
  flow(
    notEmptySingleAnswerResponse,
    chain(homePhoneNumberValidator),
    chain(makePrefixValidator(homeNumberField)),
  )
