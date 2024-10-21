import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import isInt from 'validator/lib/isInt'

import { BasicField, RatingResponseV3 } from '../../../../../shared/types'
import { ParsedClearFormFieldResponseV3 } from '../../../../types/api'
import {
  IRatingFieldSchema,
  OmitUnusedValidatorProps,
} from '../../../../types/field'
import {
  ResponseValidator,
  ResponseValidatorConstructor,
} from '../../../../types/field/utils/validation'
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

const isRatingResponseV3: ResponseValidator<
  ParsedClearFormFieldResponseV3,
  RatingResponseV3
> = (response) => {
  if (response.fieldType !== BasicField.Rating) {
    return left(
      `RatingValidatorV3.fieldTypeMismatch:\t fieldType is not rating`,
    )
  }
  return right(response)
}

/**
 * Returns a validation function to check if the
 * selected rating option is a valid option.
 */
const makeRatingLimitsValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IRatingFieldSchema>,
  RatingResponseV3
> = (ratingField) => (response) => {
  const { answer } = response
  const { steps } = ratingField.ratingOptions

  const isValid = isInt(answer, {
    min: 1,
    max: steps,
    allow_leading_zeroes: false,
  })

  return isValid
    ? right(response)
    : left(`RatingValidatorV3:\t answer is not a valid rating`)
}

export const constructRatingValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IRatingFieldSchema>,
  ParsedClearFormFieldResponseV3,
  RatingResponseV3
> = (formField) =>
  flow(isRatingResponseV3, chain(makeRatingLimitsValidatorV3(formField)))
