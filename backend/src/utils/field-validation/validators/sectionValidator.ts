import { left, right } from 'fp-ts/lib/Either'

import { ProcessedSingleAnswerResponse } from 'src/modules/submission/submission.types'
import { ResponseValidator } from 'src/types/field/utils/validation'

type SectionValidatorConstructor = () => ResponseValidator<ProcessedSingleAnswerResponse>

/**
 * Returns a validation function for a section field when called.
 */
export const constructSectionValidator: SectionValidatorConstructor = () => (
  response,
) => {
  return response.answer === ''
    ? right(response)
    : left(`SectionValidator.emptyAnswer:\tanswer is not an empty string`)
}
