import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { BasicField, NricResponseV3 } from '../../../../../shared/types'
import {
  isMFinSeriesValid,
  isNricValid,
} from '../../../../../shared/utils/nric-validation'
import { ParsedClearFormFieldResponseV3 } from '../../../../types/api'
import { ResponseValidator } from '../../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

import {
  notEmptySingleAnswerResponse,
  notEmptySingleAnswerResponseV3,
} from './common'

type NricValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type NricValidatorConstructor = () => NricValidator

/**
 * Returns a validator to check if nric
 * format is correct.
 */
const nricValidator: NricValidator = (response) => {
  return isNricValid(response.answer) || isMFinSeriesValid(response.answer)
    ? right(response)
    : left(`NricValidator:\tanswer is not a valid NRIC`)
}

/**
 * Returns a validation function for a nric field when called.
 */
export const constructNricValidator: NricValidatorConstructor = () =>
  flow(notEmptySingleAnswerResponse, chain(nricValidator))

const isNricResponseV3: ResponseValidator<
  ParsedClearFormFieldResponseV3,
  NricResponseV3
> = (response) => {
  if (response.fieldType !== BasicField.Nric) {
    return left(`NricValidatorV3.fieldTypeMismatch:\tfieldType is not nric`)
  }
  return right(response)
}

/**
 * Returns a validator to check if nric
 * format is correct.
 */
const nricValidatorV3: ResponseValidator<NricResponseV3> = (response) => {
  return isNricValid(response.answer) || isMFinSeriesValid(response.answer)
    ? right(response)
    : left(`NricValidatorV3:\tanswer is not a valid NRIC`)
}

export const constructNricValidatorV3: () => ResponseValidator<
  ParsedClearFormFieldResponseV3,
  NricResponseV3
> = () =>
  flow(
    isNricResponseV3,
    chain(notEmptySingleAnswerResponseV3),
    chain(nricValidatorV3),
  )
