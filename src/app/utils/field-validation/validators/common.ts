import { left, right } from 'fp-ts/lib/Either'

import { ProcessedSingleAnswerResponse } from 'src/app/modules/submission/submission.types'
import { ResponseValidator } from 'src/types/field/utils/validation'

export const notEmptySingleAnswerResponse: ResponseValidator<ProcessedSingleAnswerResponse> = (
  response,
) => {
  if (response.answer.trim().length === 0)
    return left(
      'CommonValidator.notEmptySingleAnswerResponse:\tanswer is an empty string',
    )
  return right(response)
}
