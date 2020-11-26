import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import isInt from 'validator/lib/isInt'

import { IRatingField } from 'src/types/field'
import { ResponseValidator } from 'src/types/field/utils/validation'
import { ISingleAnswerResponse } from 'src/types/response'

import { notEmptySingleAnswerResponse } from './common'

type RatingValidator = ResponseValidator<ISingleAnswerResponse>
type RatingValidatorConstructor = (ratingField: IRatingField) => RatingValidator

const makeRatingLimitsValidator: RatingValidatorConstructor = (ratingField) => (
  response,
) => {
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

export const constructRatingValidator: RatingValidatorConstructor = (
  ratingField,
) =>
  flow(
    notEmptySingleAnswerResponse,
    chain(makeRatingLimitsValidator(ratingField)),
  )
