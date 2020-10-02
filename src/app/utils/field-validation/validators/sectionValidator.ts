import { Either, left, right } from 'fp-ts/lib/Either'

import { ProcessedFieldResponse } from 'src/app/modules/submission/submission.types'

import { isAnswerEmpty } from './helpers'

export default (response: ProcessedFieldResponse): Either<string, boolean> => {
  return isAnswerEmpty(response.answer)
    ? right(true)
    : left('Answer not allowed')
}
