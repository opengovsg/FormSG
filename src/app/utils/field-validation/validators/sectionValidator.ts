import { Either, left, right } from 'fp-ts/lib/Either'

import { ProcessedFieldResponse } from 'src/app/modules/submission/submission.types'
import { ResponseValidator } from 'src/types/field/utils/validation'

/**
 * A function that returns a validation function for a section field when called.
 */
const constructSectionValidator = (): ResponseValidator => (
  response: ProcessedFieldResponse,
): Either<string, ProcessedFieldResponse> => {
  return response.answer === '' ? right(response) : left('Answer not allowed')
}

export default constructSectionValidator
