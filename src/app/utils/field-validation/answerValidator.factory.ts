import { left } from 'fp-ts/lib/Either'

import { BasicField } from '../../../../shared/types'
import { FieldValidationSchema, FormFieldSchema } from '../../../types'
import { ParsedClearFormFieldResponseV3 } from '../../../types/api'
import { ResponseValidator } from '../../../types/field/utils/validation'
import {
  ProcessedAttachmentResponse,
  ProcessedCheckboxResponse,
  ProcessedChildrenResponse,
  ProcessedSingleAnswerResponse,
  ProcessedTableResponse,
} from '../../modules/submission/submission.types'

import {
  constructAttachmentFieldValidatorV3,
  constructAttachmentValidator,
} from './validators/attachmentValidator'
import {
  constructCheckboxValidator,
  constructCheckboxValidatorV3,
} from './validators/checkboxValidator'
import {
  constructChildrenValidator,
  constructChildrenValidatorV3,
} from './validators/childrenValidator'
import {
  constructCountryRegionValidator,
  constructCountryRegionValidatorV3,
} from './validators/countryRegionValidator'
import {
  constructDateValidator,
  constructDateValidatorV3,
} from './validators/dateValidator'
import {
  constructDecimalValidator,
  constructDecimalValidatorV3,
} from './validators/decimalValidator'
import {
  constructDropdownValidator,
  constructDropdownValidatorV3,
} from './validators/dropdownValidator'
import {
  constructEmailValidator,
  constructEmailValidatorV3,
} from './validators/emailValidator'
import {
  constructHomeNoValidator,
  constructHomeNoValidatorV3,
} from './validators/homeNoValidator'
import {
  constructMobileNoValidator,
  constructMobileNoValidatorV3,
} from './validators/mobileNoValidator'
import {
  constructNricValidator,
  constructNricValidatorV3,
} from './validators/nricValidator'
import {
  constructNumberValidator,
  constructNumberValidatorV3,
} from './validators/numberValidator'
import {
  constructRadioButtonValidator,
  constructRadioButtonValidatorV3,
} from './validators/radioButtonValidator'
import {
  constructRatingValidator,
  constructRatingValidatorV3,
} from './validators/ratingValidator'
import {
  constructSectionValidator,
  constructSectionValidatorV3,
} from './validators/sectionValidator'
import {
  constructTableValidator,
  constructTableValidatorV3,
} from './validators/tableValidator'
import constructTextValidator, {
  constructTextValidatorV3,
} from './validators/textValidator'
import {
  constructUenValidator,
  constructUenValidatorV3,
} from './validators/uenValidator'
import {
  constructYesNoValidator,
  constructYesNoValidatorV3,
} from './validators/yesNoValidator'
import { isGenericStringAnswerResponseV3 } from './field-validation.guards'

/**
 * Constructs a validation function for a single answer response, using a form field field as a specification.
 * @param formField A form field from a form object
 */
export const constructSingleAnswerValidator = (
  formField: FieldValidationSchema,
): ResponseValidator<ProcessedSingleAnswerResponse> => {
  switch (formField.fieldType) {
    case BasicField.Section:
      return constructSectionValidator()
    case BasicField.ShortText:
    case BasicField.LongText:
      return constructTextValidator(formField)
    case BasicField.Nric:
      return constructNricValidator()
    case BasicField.HomeNo:
      return constructHomeNoValidator(formField)
    case BasicField.Radio:
      return constructRadioButtonValidator(formField)
    case BasicField.Rating:
      return constructRatingValidator(formField)
    case BasicField.Mobile:
      return constructMobileNoValidator(formField)
    case BasicField.Date:
      return constructDateValidator(formField)
    case BasicField.Number:
      return constructNumberValidator(formField)
    case BasicField.Decimal:
      return constructDecimalValidator(formField)
    case BasicField.Dropdown:
      return constructDropdownValidator(formField)
    case BasicField.CountryRegion:
      return constructCountryRegionValidator()
    case BasicField.Email:
      return constructEmailValidator(formField)
    case BasicField.Uen:
      return constructUenValidator()
    case BasicField.YesNo:
      return constructYesNoValidator()
    default:
      return () => left('Unsupported field type')
  }
}

export const constructAttachmentFieldValidator = (
  // Separate from constructSingleAnswerValidator as
  // constructAttachmentValidator returns different type
  formField: FieldValidationSchema,
): ResponseValidator<ProcessedAttachmentResponse> => {
  if (formField.fieldType === BasicField.Attachment) {
    return constructAttachmentValidator(formField)
  }
  return () => left('Unsupported field type')
}

export const constructCheckboxFieldValidator = (
  formField: FieldValidationSchema,
): ResponseValidator<ProcessedCheckboxResponse> => {
  if (formField.fieldType === BasicField.Checkbox) {
    return constructCheckboxValidator(formField)
  }
  return () => left('Unsupported field type')
}

export const constructChildFieldValidator = (
  formField: FieldValidationSchema,
): ResponseValidator<ProcessedChildrenResponse> => {
  if (formField.fieldType === BasicField.Children) {
    return constructChildrenValidator(formField)
  }
  return () => left('Unsupported field type')
}

export const constructTableFieldValidator = (
  formField: FieldValidationSchema,
): ResponseValidator<ProcessedTableResponse> => {
  if (formField.fieldType === BasicField.Table) {
    return constructTableValidator(formField)
  }
  return () => left('Unsupported field type')
}

const constructGenericStringAnswerResponseValidatorV3 = (
  formField: FormFieldSchema,
): ResponseValidator<ParsedClearFormFieldResponseV3> => {
  switch (formField.fieldType) {
    case BasicField.Number:
      return constructNumberValidatorV3(formField)
    case BasicField.Decimal:
      return constructDecimalValidatorV3(formField)
    case BasicField.ShortText:
    case BasicField.LongText:
      return constructTextValidatorV3(formField)
    case BasicField.HomeNo:
      return constructHomeNoValidatorV3(formField)
    case BasicField.Dropdown:
      return constructDropdownValidatorV3(formField)
    case BasicField.Rating:
      return constructRatingValidatorV3(formField)
    case BasicField.Nric:
      return constructNricValidatorV3()
    case BasicField.Uen:
      return constructUenValidatorV3()
    case BasicField.Date:
      return constructDateValidatorV3(formField)
    case BasicField.CountryRegion:
      return constructCountryRegionValidatorV3()
  }
  return () => left('Unsupported field type')
}

export const constructFieldResponseValidatorV3 = ({
  formId,
  response,
  formField,
  isVisible,
}: {
  formId: string
  response: ParsedClearFormFieldResponseV3
  formField: FormFieldSchema
  isVisible: boolean
}): ResponseValidator<ParsedClearFormFieldResponseV3> => {
  if (isGenericStringAnswerResponseV3(response.fieldType)) {
    return constructGenericStringAnswerResponseValidatorV3(formField)
  }
  switch (formField.fieldType) {
    case BasicField.Section:
      return constructSectionValidatorV3()
    case BasicField.YesNo:
      return constructYesNoValidatorV3()
    case BasicField.Email:
      return constructEmailValidatorV3(formField)
    case BasicField.Mobile:
      return constructMobileNoValidatorV3(formField)
    case BasicField.Table:
      return constructTableValidatorV3({
        tableField: formField,
        formId,
        isVisible,
        isDisabled: formField.disabled,
      })
    case BasicField.Radio:
      return constructRadioButtonValidatorV3(formField)
    case BasicField.Checkbox:
      return constructCheckboxValidatorV3(formField)
    case BasicField.Attachment:
      return constructAttachmentFieldValidatorV3(formField)
    case BasicField.Children:
      return constructChildrenValidatorV3(formField)
  }

  return () => left('Unsupported field type')
}
