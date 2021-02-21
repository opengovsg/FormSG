import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ProcessedSingleAnswerResponse } from 'src/app/modules/submission/submission.types'
import { ResponseValidator } from 'src/types/field/utils/validation'

import { isNricValid } from '../../../../shared/util/nric-validation'

import { notEmptySingleAnswerResponse } from './common'

type NricValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type NricValidatorConstructor = () => NricValidator

/**
 * A function that returns a validator to check if nric
 * format is correct
 */
const nricValidator: NricValidator = (response) => {
  return isNricValid(response.answer)
    ? right(response)
    : left(`NricValidator:\tanswer is not a valid NRIC`)
}

/**
 * A function that returns a validation function for a nric field when called.
 */
export const constructNricValidator: NricValidatorConstructor = () =>
  flow(notEmptySingleAnswerResponse, chain(nricValidator))
