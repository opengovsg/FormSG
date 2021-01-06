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

const homePhoneNumberValidator: HomeNoValidator = (response) => {
  return isHomePhoneNumber(response.answer)
    ? right(response)
    : left(`HomeNoValidator:\t answer is not a valid home phone number`)
}

const sgPrefixValidator: HomeNoValidator = (response) => {
  return startsWithSgPrefix(response.answer)
    ? right(response)
    : left(
        `HomeNoValidator:\t answer is not an SG number but intl numbers are not allowed`,
      )
}

const makePrefixValidator: HomeNoValidatorConstructor = (homeNumberField) => {
  return homeNumberField.allowIntlNumbers ? right : sgPrefixValidator
}

export const constructHomeNoValidator: HomeNoValidatorConstructor = (
  homeNumberField,
) =>
  flow(
    notEmptySingleAnswerResponse,
    chain(homePhoneNumberValidator),
    chain(makePrefixValidator(homeNumberField)),
  )
