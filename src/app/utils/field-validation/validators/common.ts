import { left, right } from 'fp-ts/lib/Either'

import { ResponseValidator } from 'src/types/field/utils/validation'
import { ISingleAnswerResponse } from 'src/types/response'

export const notEmptySingleAnswerResponse: ResponseValidator<ISingleAnswerResponse> = (
  response,
) => {
  if (response.answer.trim().length === 0)
    return left('notEmptySingleAnswerResponse')
  return right(response)
}
