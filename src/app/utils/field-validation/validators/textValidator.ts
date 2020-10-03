import { Either, left, right } from 'fp-ts/lib/Either'

import { ProcessedFieldResponse } from 'src/app/modules/submission/submission.types'
import { ILongTextField, IShortTextField } from 'src/types/field'
import { ResponseValidator } from 'src/types/field/utils/validation'

/**
 * A function that returns a validation function for a text field when called.
 */
const constructTextValidator = (
  textField: IShortTextField | ILongTextField,
): ResponseValidator => (
  response: ProcessedFieldResponse,
): Either<string, ProcessedFieldResponse> => {
  return right(response)
}

export default constructTextValidator
