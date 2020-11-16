import { chain, left, right } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'

import { isNricValid } from 'src/shared/util/nric-validation'
import { ResponseValidator } from 'src/types/field/utils/validation'
import { ISingleAnswerResponse } from 'src/types/response'

import { notEmptySingleAnswerResponse } from './common'

type NricValidator = ResponseValidator<ISingleAnswerResponse>
type NricValidatorConstructor = () => NricValidator

const nricValidator: NricValidator = (response) => {
  return isNricValid(response.answer)
    ? right(response)
    : left(`NricValidator:\tanswer is not a valid NRIC`)
}

export const constructNricValidator: NricValidatorConstructor = () => (
  response,
) => pipe(notEmptySingleAnswerResponse(response), chain(nricValidator))
