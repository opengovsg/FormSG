import { left } from 'fp-ts/lib/Either'

import { IField } from '../../../types/field/baseField'
import {
  isLongTextField,
  isNricField,
  isSectionField,
  isShortTextField,
} from '../../../types/field/utils/guards'
import { ResponseValidator } from '../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../modules/submission/submission.types'

import { constructNricValidator } from './validators/nricValidator'
import { constructSectionValidator } from './validators/sectionValidator'
import constructTextValidator from './validators/textValidator'

/**
 * Constructs a validation function for a single answer response, using a form field field as a specification.
 * @param formField A form field from a form object
 */
export const constructSingleAnswerValidator = (
  formField: IField,
): ResponseValidator<ProcessedSingleAnswerResponse> => {
  if (isSectionField(formField)) {
    return constructSectionValidator()
  } else if (isShortTextField(formField) || isLongTextField(formField)) {
    return constructTextValidator(formField)
  } else if (isNricField(formField)) {
    return constructNricValidator()
  }
  return () => left('Unsupported field type')
}
