import { StringAnswerV4 } from '@opengovsg/formsg-sdk'
import { BasicField } from 'formsg-shared/types'
import { left, right } from 'fp-ts/lib/Either'

import { ParsedClearFormFieldResponseV4 } from '../../../../types/api'
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

// V4

type SectionResponseV4 = ParsedClearFormFieldResponseV4 & {
  fieldType: BasicField.Section
  answer: StringAnswerV4
}

type SectionValidatorConstructorV4 = () => ResponseValidator<
  ParsedClearFormFieldResponseV4,
  SectionResponseV4
>

export const constructSectionValidatorV4: SectionValidatorConstructorV4 =
  () => (response) => {
    if (response.fieldType !== BasicField.Section) {
      return left(
        'SectionValidatorV4.fieldTypeMismatch:\tfield type is not section',
      )
    }
    return right(response as SectionResponseV4)
  }
