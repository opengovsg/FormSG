import { Either, left, right } from 'fp-ts/lib/Either'

import { ProcessedFieldResponse } from 'src/app/modules/submission/submission.types'
import { ResponseValidator } from 'src/types/field/utils/validation'

import { isAnswerEmpty } from './common'

/**
 * A function that returns a validation function for a section field when called.
 */
const constructSectionValidator = (): ResponseValidator => (
  response: ProcessedFieldResponse,
): Either<string, boolean> => {
  return isAnswerEmpty(response.answer)
    ? right(true)
    : left('Answer not allowed')
}

export default constructSectionValidator
