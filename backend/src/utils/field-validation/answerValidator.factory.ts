import { left } from 'fp-ts/lib/Either'

import { IField } from '@root/types/field/fieldTypes'
import {
  isAttachmentField,
  isCheckboxField,
  isDateField,
  isDecimalField,
  isDropdownField,
  isEmailField,
  isHomeNumberField,
  isLongTextField,
  isMobileNumberField,
  isNricField,
  isNumberField,
  isRadioButtonField,
  isRatingField,
  isSectionField,
  isShortTextField,
  isTableField,
  isYesNoField,
} from '@root/types/field/utils/guards'
import { ResponseValidator } from '@root/types/field/utils/validation'
import {
  ProcessedAttachmentResponse,
  ProcessedCheckboxResponse,
  ProcessedSingleAnswerResponse,
  ProcessedTableResponse,
} from '../../modules/submission/submission.types'

import { constructAttachmentValidator } from './validators/attachmentValidator'
import { constructCheckboxValidator } from './validators/checkboxValidator'
import { constructDateValidator } from './validators/dateValidator'
import { constructDecimalValidator } from './validators/decimalValidator'
import { constructDropdownValidator } from './validators/dropdownValidator'
import { constructEmailValidator } from './validators/emailValidator'
import { constructHomeNoValidator } from './validators/homeNoValidator'
import { constructMobileNoValidator } from './validators/mobileNoValidator'
import { constructNricValidator } from './validators/nricValidator'
import { constructNumberValidator } from './validators/numberValidator'
import { constructRadioButtonValidator } from './validators/radioButtonValidator'
import { constructRatingValidator } from './validators/ratingValidator'
import { constructSectionValidator } from './validators/sectionValidator'
import { constructTableValidator } from './validators/tableValidator'
import constructTextValidator from './validators/textValidator'
import { constructYesNoValidator } from './validators/yesNoValidator'

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
  } else if (isMobileNumberField(formField)) {
    return constructMobileNoValidator(formField)
  } else if (isDateField(formField)) {
    return constructDateValidator(formField)
  } else if (isNumberField(formField)) {
    return constructNumberValidator(formField)
  } else if (isDecimalField(formField)) {
    return constructDecimalValidator(formField)
  } else if (isDropdownField(formField)) {
    return constructDropdownValidator(formField)
  } else if (isEmailField(formField)) {
    return constructEmailValidator(formField)
  } else if (isYesNoField(formField)) {
    return constructYesNoValidator()
  }
  return () => left('Unsupported field type')
}

export const constructAttachmentFieldValidator = (
  // Separate from constructSingleAnswerValidator as
  // constructAttachmentValidator returns different type
  formField: IField,
): ResponseValidator<ProcessedAttachmentResponse> => {
  if (isAttachmentField(formField)) {
    return constructAttachmentValidator(formField)
  }
  return () => left('Unsupported field type')
}

export const constructCheckboxFieldValidator = (
  formField: IField,
): ResponseValidator<ProcessedCheckboxResponse> => {
  if (isCheckboxField(formField)) {
    return constructCheckboxValidator(formField)
  }
  return () => left('Unsupported field type')
}

export const constructTableFieldValidator = (
  formField: IField,
): ResponseValidator<ProcessedTableResponse> => {
  if (isTableField(formField)) {
    return constructTableValidator(formField)
  }
  return () => left('Unsupported field type')
}
