import { BasicField, FormFieldDto } from 'formsg-shared/types'
import { left } from 'fp-ts/lib/Either'

import { FieldValidationSchema } from '../../../types'
import { ParsedClearFormFieldResponseV4 } from '../../../types/api'
import { ResponseValidator } from '../../../types/field/utils/validation'
import {
  ProcessedAddressResponse,
  ProcessedAttachmentResponse,
  ProcessedCheckboxResponse,
  ProcessedChildrenResponse,
  ProcessedSignatureResponse,
  ProcessedSingleAnswerResponse,
  ProcessedTableResponse,
} from '../../modules/submission/submission.types'

import {
  constructAddressValidator,
  constructAddressValidatorV4,
  constructOptionalAddressValidator,
  constructOptionalAddressValidatorV4,
} from './validators/addressValidator'
import {
  constructAttachmentFieldValidatorV4,
  constructAttachmentValidator,
} from './validators/attachmentValidator'
import {
  constructCheckboxValidator,
  constructCheckboxValidatorV4,
} from './validators/checkboxValidator'
import {
  constructChildrenValidator,
  constructChildrenValidatorV4,
} from './validators/childrenValidator'
import {
  constructCountryRegionValidator,
  constructCountryRegionValidatorV4,
} from './validators/countryRegionValidator'
import {
  constructDateValidator,
  constructDateValidatorV4,
} from './validators/dateValidator'
import {
  constructDecimalValidator,
  constructDecimalValidatorV4,
} from './validators/decimalValidator'
import {
  constructDropdownValidator,
  constructDropdownValidatorV4,
} from './validators/dropdownValidator'
import {
  constructEmailValidator,
  constructEmailValidatorV4,
} from './validators/emailValidator'
import {
  constructHomeNoValidator,
  constructHomeNoValidatorV4,
} from './validators/homeNoValidator'
import {
  constructMobileNoValidator,
  constructMobileNoValidatorV4,
} from './validators/mobileNoValidator'
import {
  constructNricValidator,
  constructNricValidatorV4,
} from './validators/nricValidator'
import {
  constructNumberValidator,
  constructNumberValidatorV4,
} from './validators/numberValidator'
import {
  constructRadioButtonValidator,
  constructRadioButtonValidatorV4,
} from './validators/radioButtonValidator'
import {
  constructRatingValidator,
  constructRatingValidatorV4,
} from './validators/ratingValidator'
import {
  constructSectionValidator,
  constructSectionValidatorV4,
} from './validators/sectionValidator'
import {
  constructSignatureValidator,
  constructSignatureValidatorV4,
} from './validators/signatureValidator'
import {
  constructTableValidator,
  constructTableValidatorV4,
} from './validators/tableValidator'
import constructTextValidator, {
  constructTextValidatorV4,
} from './validators/textValidator'
import {
  constructTimeValidator,
  constructTimeValidatorV4,
} from './validators/timeValidator'
import {
  constructUenValidator,
  constructUenValidatorV4,
} from './validators/uenValidator'
import {
  constructYesNoValidator,
  constructYesNoValidatorV4,
} from './validators/yesNoValidator'

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
    case BasicField.Time:
      return constructTimeValidator()
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

export const constructAddressFieldValidator = (
  formField: FieldValidationSchema,
): ResponseValidator<ProcessedAddressResponse> => {
  if (formField.fieldType === BasicField.Address) {
    return constructAddressValidator(formField)
  }
  return () => left('Unsupported field type')
}

export const constructOptionalAddressFieldValidator = (
  formField: FieldValidationSchema,
): ResponseValidator<ProcessedAddressResponse> => {
  if (formField.fieldType === BasicField.Address) {
    return constructOptionalAddressValidator(formField)
  }
  return () => left('Unsupported field type')
}

export const constructSignatureFieldValidator = (
  formField: FieldValidationSchema,
): ResponseValidator<ProcessedSignatureResponse> => {
  if (formField.fieldType === BasicField.Signature) {
    return constructSignatureValidator(formField)
  }
  return () => left('Unsupported field type')
}

export const constructFieldResponseValidatorV4 = ({
  formId,
  formField,
  isVisible,
}: {
  formId: string
  formField: FormFieldDto
  isVisible: boolean
}): ResponseValidator<ParsedClearFormFieldResponseV4> => {
  switch (formField.fieldType) {
    case BasicField.Number:
      return constructNumberValidatorV4(formField)
    case BasicField.Decimal:
      return constructDecimalValidatorV4(formField)
    case BasicField.ShortText:
    case BasicField.LongText:
      return constructTextValidatorV4(formField)
    case BasicField.HomeNo:
      return constructHomeNoValidatorV4(formField)
    case BasicField.Dropdown:
      return constructDropdownValidatorV4(formField)
    case BasicField.Rating:
      return constructRatingValidatorV4(formField)
    case BasicField.Nric:
      return constructNricValidatorV4()
    case BasicField.Uen:
      return constructUenValidatorV4()
    case BasicField.Date:
      return constructDateValidatorV4(formField)
    case BasicField.Time:
      return constructTimeValidatorV4
    case BasicField.CountryRegion:
      return constructCountryRegionValidatorV4()
    case BasicField.Section:
      return constructSectionValidatorV4()
    case BasicField.YesNo:
      return constructYesNoValidatorV4()
    case BasicField.Email:
      return constructEmailValidatorV4(formField)
    case BasicField.Mobile:
      return constructMobileNoValidatorV4(formField)
    case BasicField.Table:
      return constructTableValidatorV4({
        tableField: formField,
        formId,
        isVisible,
        isDisabled: formField.disabled,
      })
    case BasicField.Radio:
      return constructRadioButtonValidatorV4(formField)
    case BasicField.Checkbox:
      return constructCheckboxValidatorV4(formField)
    case BasicField.Attachment:
      return constructAttachmentFieldValidatorV4(formField)
    case BasicField.Children:
      return constructChildrenValidatorV4(formField)
    case BasicField.Address:
      if (formField.required) return constructAddressValidatorV4(formField)
      return constructOptionalAddressValidatorV4(formField)
    case BasicField.Signature:
      return constructSignatureValidatorV4(formField)
    case BasicField.Image: // fall-through
    case BasicField.Statement:
      return () =>
        left('Unsupported field type: field should not be part of response')
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const exhaustiveCheck: never = formField
      return () => left('Unsupported field type')
    }
  }
}
