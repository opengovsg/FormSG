import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ProcessedSingleAnswerResponse } from 'src/app/modules/submission/submission.types'
import { ResponseValidator } from 'src/types/field/utils/validation'

import { isUenValid } from '../../../../../shared/utils/uen-validation'

import { notEmptySingleAnswerResponse } from './common'

type UenValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type UenValidatorConstructor = () => UenValidator

/**
 * Returns a validator to check if uen
 * format is correct.
 */
const uenValidator: UenValidator = (response) => {
  return isUenValid(response.answer)
    ? right(response)
    : left(`UenValidator:\tanswer is not a valid UEN`)
}

/**
 * Returns a validation function for a uen field when called.
 */
export const constructUenValidator: UenValidatorConstructor = () =>
  flow(notEmptySingleAnswerResponse, chain(uenValidator))
