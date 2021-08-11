import { left, right } from 'fp-ts/lib/Either'

import { ResponseValidator } from '../../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

type SectionValidatorConstructor =
  () => ResponseValidator<ProcessedSingleAnswerResponse>

/**
 * Returns a validation function for a section field when called.
 */
export const constructSectionValidator: SectionValidatorConstructor =
  () => (response) => {
    return response.answer === ''
      ? right(response)
      : left(`SectionValidator.emptyAnswer:\tanswer is not an empty string`)
  }
