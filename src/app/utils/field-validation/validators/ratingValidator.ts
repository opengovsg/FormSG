import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import isInt from 'validator/lib/isInt'

import {
  IRatingFieldSchema,
  OmitUnusedValidatorProps,
} from '../../../../types/field'
import { ResponseValidator } from '../../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

import { notEmptySingleAnswerResponse } from './common'

type RatingValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type RatingValidatorConstructor = (
  ratingField: OmitUnusedValidatorProps<IRatingFieldSchema>,
) => RatingValidator

/**
 * Returns a validation function to check if the
 * selected rating option is a valid option.
 */
const makeRatingLimitsValidator: RatingValidatorConstructor =
  (ratingField) => (response) => {
    const { answer } = response
    const { steps } = ratingField.ratingOptions

    const isValid = isInt(answer, {
      min: 1,
      max: steps,
      allow_leading_zeroes: false,
    })

    return isValid
      ? right(response)
      : left(`RatingValidator:\t answer is not a valid rating`)
  }

/**
 * Returns a validation function for a rating field when called.
 */
export const constructRatingValidator: RatingValidatorConstructor = (
  ratingField,
) =>
  flow(
    notEmptySingleAnswerResponse,
    chain(makeRatingLimitsValidator(ratingField)),
  )
