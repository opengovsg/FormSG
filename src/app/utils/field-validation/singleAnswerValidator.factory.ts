import { left } from 'fp-ts/lib/Either'

import { IField } from '../../../types/field/baseField'
import {
  isHomeNumberField,
  isLongTextField,
  isNricField,
  isRadioButtonField,
  isRatingField,
  isSectionField,
  isShortTextField,
} from '../../../types/field/utils/guards'
import { ResponseValidator } from '../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../modules/submission/submission.types'

import { constructHomeNoValidator } from './validators/homeNoValidator'
import { constructNricValidator } from './validators/nricValidator'
import { constructRadioButtonValidator } from './validators/radioButtonValidator'
import { constructRatingValidator } from './validators/ratingValidator'
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
  } else if (isHomeNumberField(formField)) {
    return constructHomeNoValidator(formField)
  } else if (isRadioButtonField(formField)) {
    return constructRadioButtonValidator(formField)
  } else if (isRatingField(formField)) {
    return constructRatingValidator(formField)
  }
  return () => left('Unsupported field type')
}
