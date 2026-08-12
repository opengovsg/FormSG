import { StringAnswerV4 } from '@opengovsg/formsg-sdk'
import { BasicField } from 'formsg-shared/types'
import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import isInt from 'validator/lib/isInt'

import { ParsedClearFormFieldResponseV4 } from '../../../../types/api'
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

// V4

type RatingResponseV4 = ParsedClearFormFieldResponseV4 & {
  fieldType: BasicField.Rating
  answer: StringAnswerV4
}

const isRatingResponseV4: ResponseValidator<
  ParsedClearFormFieldResponseV4,
  RatingResponseV4
> = (response) => {
  if (response.fieldType !== BasicField.Rating) {
    return left(
      `RatingValidatorV4.fieldTypeMismatch:\t fieldType is not rating`,
    )
  }
  return right(response as RatingResponseV4)
}

const makeRatingLimitsValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IRatingFieldSchema>,
  RatingResponseV4
> = (ratingField) => (response) => {
  const { value } = response.answer
  const { steps } = ratingField.ratingOptions

  const isValid = isInt(value, {
    min: 1,
    max: steps,
    allow_leading_zeroes: false,
  })

  return isValid
    ? right(response)
    : left(`RatingValidatorV4:\t answer is not a valid rating`)
}

export const constructRatingValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IRatingFieldSchema>,
  ParsedClearFormFieldResponseV4,
  RatingResponseV4
> = (formField) =>
  flow(isRatingResponseV4, chain(makeRatingLimitsValidatorV4(formField)))
