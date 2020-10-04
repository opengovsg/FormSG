import { left, right } from 'fp-ts/lib/Either'

import { ResponseValidator } from 'src/types/field/utils/validation'

type sectionValidatorConstructor = () => ResponseValidator

/**
 * A function that returns a validation function for a section field when called.
 */
const constructSectionValidator: sectionValidatorConstructor = () => (
  response,
) => {
  return response.answer === '' ? right(response) : left('Answer not allowed')
}

export default constructSectionValidator
