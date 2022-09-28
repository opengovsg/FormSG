/**
 * This utility file creates validation rules for `react-hook-form` according
 * to the field schema.
 */
import { RegisterOptions } from 'react-hook-form'
import { isDate, parseISO } from 'date-fns'
import simplur from 'simplur'
import validator from 'validator'

import {
  AttachmentFieldBase,
  CheckboxFieldBase,
  DateFieldBase,
  DateSelectedValidation,
  DecimalFieldBase,
  DropdownFieldBase,
  EmailFieldBase,
  FieldBase,
  HomenoFieldBase,
  LongTextFieldBase,
  MobileFieldBase,
  NricFieldBase,
  NumberFieldBase,
  NumberSelectedValidation,
  RadioFieldBase,
  RatingFieldBase,
  ShortTextFieldBase,
  TextSelectedValidation,
  UenFieldBase,
} from '~shared/types/field'
import { isMFinSeriesValid, isNricValid } from '~shared/utils/nric-validation'
import {
  isHomePhoneNumber,
  isMobilePhoneNumber,
} from '~shared/utils/phone-num-validation'
import { isUenValid } from '~shared/utils/uen-validation'

import {
  INVALID_COUNTRY_REGION_OPTION_ERROR,
  INVALID_DROPDOWN_OPTION_ERROR,
  INVALID_EMAIL_DOMAIN_ERROR,
  INVALID_EMAIL_ERROR,
  REQUIRED_ERROR,
} from '~constants/validation'
import { VerifiableFieldValues } from '~templates/Field/types'

import { VerifiableFieldBase } from '~features/verifiable-fields/types'

import { isDateAfterToday, isDateBeforeToday, isDateOutOfRange } from './date'
import { formatNumberToLocaleString } from './stringFormat'

type OmitUnusedProps<T extends FieldBase> = Omit<
  T,
  'fieldType' | 'description' | 'disabled'
>

export type ValidationRuleFn<T extends FieldBase = FieldBase> = (
  schema: OmitUnusedProps<T>,
) => RegisterOptions

const createRequiredValidationRules = (
  schema: Pick<FieldBase, 'required'>,
): RegisterOptions['required'] => {
  return {
    value: schema.required,
    message: REQUIRED_ERROR,
  }
}

/**
 * Validation rules for verifiable fields.
 * @param schema verifiable field schema
 * @returns base verifiable fields' validation rules
 */
const createBaseVfnFieldValidationRules: ValidationRuleFn<
  VerifiableFieldBase
> = (schema) => {
  return {
    validate: {
      required: (value?: VerifiableFieldValues) => {
        if (!schema.required) return true
        return !!value?.value || REQUIRED_ERROR
      },
      hasSignature: (val?: VerifiableFieldValues) => {
        if (!schema.isVerifiable) return true
        // Either signature is filled, or both fields have no input.
        if (!!val?.signature || (!val?.value && !val?.signature)) {
          return true
        }
        return 'Field verification is required'
      },
    },
  }
}

const createRequiredInValidationRules = (
  schema: Pick<FieldBase, 'required'>,
): RegisterOptions['validate'] => {
  return {
    required: (value: unknown) => {
      if (!schema.required) return true
      return !!value || REQUIRED_ERROR
    },
  }
}

export const createBaseValidationRules = (
  schema: Pick<FieldBase, 'required'>,
): RegisterOptions => {
  return {
    required: createRequiredValidationRules(schema),
  }
}

export const createDropdownValidationRules: ValidationRuleFn<
  DropdownFieldBase
> = (schema): RegisterOptions => {
  return createDropdownValidationRulesWithCustomErrorMessage(
    INVALID_DROPDOWN_OPTION_ERROR,
  )(schema)
}

export const createCountryRegionValidationRules: ValidationRuleFn<
  DropdownFieldBase
> = (schema): RegisterOptions => {
  return createDropdownValidationRulesWithCustomErrorMessage(
    INVALID_COUNTRY_REGION_OPTION_ERROR,
  )(schema)
}

export const createDropdownValidationRulesWithCustomErrorMessage: (
  errorMessage: string,
) => ValidationRuleFn<DropdownFieldBase> =
  (errorMessage) =>
  (schema): RegisterOptions => {
    return {
      ...createBaseValidationRules(schema),
      validate: {
        validOptions: (value: string) => {
          if (!value) return
          return schema.fieldOptions.includes(value) || errorMessage
        },
      },
    }
  }

export const createRatingValidationRules: ValidationRuleFn<RatingFieldBase> = (
  schema,
): RegisterOptions => {
  return {
    validate: {
      ...createRequiredInValidationRules(schema),
    },
  }
}

export const createAttachmentValidationRules: ValidationRuleFn<
  AttachmentFieldBase
> = (schema) => {
  return createBaseValidationRules(schema)
}

export const createHomeNoValidationRules: ValidationRuleFn<HomenoFieldBase> = (
  schema,
) => {
  return {
    ...createBaseValidationRules(schema),
    validate: (val?: string) => {
      if (!val) return true
      return isHomePhoneNumber(val) || 'Please enter a valid landline number'
    },
  }
}

export const createMobileValidationRules: ValidationRuleFn<MobileFieldBase> = (
  schema,
) => {
  return {
    validate: {
      baseValidations: (val?: VerifiableFieldValues) => {
        return baseMobileValidationFn(schema)(val?.value)
      },
      ...createBaseVfnFieldValidationRules(schema).validate,
    },
  }
}

export const createNumberValidationRules: ValidationRuleFn<NumberFieldBase> = (
  schema,
) => {
  const { selectedValidation, customVal } = schema.ValidationOptions

  return {
    ...createBaseValidationRules(schema),
    validate: (val?: string) => {
      if (!val || !customVal) return true

      const currLen = val.length

      switch (selectedValidation) {
        case NumberSelectedValidation.Exact:
          return (
            currLen === customVal ||
            simplur`Please enter ${customVal} digit[|s] (${currLen}/${customVal})`
          )
        case NumberSelectedValidation.Min:
          return (
            currLen >= customVal ||
            simplur`Please enter at least ${customVal} digit[|s] (${currLen}/${customVal})`
          )
        case NumberSelectedValidation.Max:
          return (
            currLen <= customVal ||
            simplur`Please enter at most ${customVal} digit[|s] (${currLen}/${customVal})`
          )
      }
    },
  }
}

export const createDecimalValidationRules: ValidationRuleFn<
  DecimalFieldBase
> = (schema) => {
  return {
    ...createBaseValidationRules(schema),
    validate: (val: string) => {
      const {
        ValidationOptions: { customMax, customMin },
        validateByValue,
      } = schema
      if (!val) return true

      const numVal = Number(val)
      if (isNaN(numVal)) {
        return 'Please enter a valid decimal'
      }

      // Validate leading zeros
      if (/^0[0-9]/.test(val)) {
        return 'Please enter a valid decimal without leading zeros'
      }

      if (!validateByValue) return true

      if (
        customMin &&
        customMax &&
        (numVal < customMin || numVal > customMax)
      ) {
        return `Please enter a decimal between ${formatNumberToLocaleString(
          customMin,
        )} and ${formatNumberToLocaleString(customMax)} (inclusive)`
      }

      if (customMin && numVal < customMin) {
        return `Please enter a decimal greater than or equal to ${formatNumberToLocaleString(
          customMin,
        )}`
      }

      if (customMax && numVal > customMax) {
        return `Please enter a decimal less than or equal to ${formatNumberToLocaleString(
          customMax,
        )}`
      }

      return true
    },
  }
}

export const createTextValidationRules: ValidationRuleFn<
  ShortTextFieldBase | LongTextFieldBase
> = (schema) => {
  const { selectedValidation, customVal } = schema.ValidationOptions
  return {
    ...createBaseValidationRules(schema),
    validate: (val?: string) => {
      if (!val || !customVal) return true

      const currLen = val.length

      switch (selectedValidation) {
        case TextSelectedValidation.Exact:
          return (
            currLen === customVal ||
            simplur`Please enter ${customVal} character[|s] (${currLen}/${customVal})`
          )
        case TextSelectedValidation.Minimum:
          return (
            currLen >= customVal ||
            simplur`Please enter at least ${customVal} character[|s] (${currLen}/${customVal})`
          )
        case TextSelectedValidation.Maximum:
          return (
            currLen <= customVal ||
            simplur`Please enter at most ${customVal} character[|s] (${currLen}/${customVal})`
          )
      }
    },
  }
}

export const createUenValidationRules: ValidationRuleFn<UenFieldBase> = (
  schema,
) => {
  return {
    ...createBaseValidationRules(schema),
    validate: (val?: string) => {
      if (!val) return true
      return isUenValid(val) || 'Please enter a valid UEN'
    },
  }
}

export const createNricValidationRules: ValidationRuleFn<NricFieldBase> = (
  schema,
) => {
  return {
    ...createBaseValidationRules(schema),
    validate: (val?: string) => {
      if (!val) return true
      return (
        isNricValid(val) ||
        isMFinSeriesValid(val) ||
        'Please enter a valid NRIC'
      )
    },
  }
}

export const createCheckboxValidationRules: ValidationRuleFn<
  CheckboxFieldBase
> = (schema) => {
  return {
    ...createBaseValidationRules(schema),
    validate: (val?: string[]) => {
      const {
        ValidationOptions: { customMin, customMax },
        validateByValue,
      } = schema
      if (!val || val.length === 0 || !validateByValue) return true

      if (
        customMin &&
        customMax &&
        customMin === customMax &&
        val.length !== customMin
      ) {
        return simplur`Please select exactly ${customMin} option[|s] (${val.length}/${customMin})`
      }

      if (customMin && val.length < customMin) {
        return simplur`Please select at least ${customMin} option[|s] (${val.length}/${customMin})`
      }

      if (customMax && val.length > customMax) {
        return simplur`Please select at most ${customMax} option[|s] (${val.length}/${customMax})`
      }

      return true
    },
  }
}

export const createDateValidationRules: ValidationRuleFn<DateFieldBase> = (
  schema,
) => {
  return {
    ...createBaseValidationRules(schema),
    validate: {
      validDate: (val) =>
        !val || isDate(parseISO(val)) || 'Please enter a valid date',
      noFuture: (val) => {
        if (
          !val ||
          schema.dateValidation.selectedDateValidation !==
            DateSelectedValidation.NoFuture
        ) {
          return true
        }
        return (
          !isDateAfterToday(parseISO(val)) ||
          'Only dates today or before are allowed'
        )
      },
      noPast: (val) => {
        if (
          !val ||
          schema.dateValidation.selectedDateValidation !==
            DateSelectedValidation.NoPast
        ) {
          return true
        }
        return (
          !isDateBeforeToday(parseISO(val)) ||
          'Only dates today or after are allowed'
        )
      },
      range: (val) => {
        if (
          !val ||
          schema.dateValidation.selectedDateValidation !==
            DateSelectedValidation.Custom
        ) {
          return true
        }

        const { customMinDate, customMaxDate } = schema.dateValidation ?? {}
        return (
          !isDateOutOfRange(parseISO(val), customMinDate, customMaxDate) ||
          'Selected date is not within the allowed date range'
        )
      },
    },
  }
}

export const createRadioValidationRules: ValidationRuleFn<RadioFieldBase> = (
  schema,
) => {
  return createBaseValidationRules(schema)
}

export const createEmailValidationRules: ValidationRuleFn<EmailFieldBase> = (
  schema,
) => {
  return {
    validate: {
      baseValidations: (val?: VerifiableFieldValues) => {
        return baseEmailValidationFn(schema)(val?.value)
      },
      ...createBaseVfnFieldValidationRules(schema).validate,
    },
  }
}

/**
 * To be shared between the verifiable and non-verifiable variant.
 * @returns error string if field is invalid, true otherwise.
 */
export const baseEmailValidationFn =
  (schema: OmitUnusedProps<EmailFieldBase>) => (inputValue?: string) => {
    if (!inputValue) {
      return true
    }

    // Valid email check
    if (!validator.isEmail(inputValue)) {
      return INVALID_EMAIL_ERROR
    }

    const allowedDomains = schema.isVerifiable
      ? new Set(schema.allowedEmailDomains)
      : new Set()

    // Valid domain check
    if (allowedDomains.size !== 0) {
      const domainInValue = inputValue.split('@')[1]
      if (domainInValue && !allowedDomains.has(`@${domainInValue}`)) {
        return INVALID_EMAIL_DOMAIN_ERROR
      }
    }
    // Passed all error validation.
    return true
  }

export const baseMobileValidationFn =
  (_schema: OmitUnusedProps<MobileFieldBase>) => (inputValue?: string) => {
    if (!inputValue) {
      return true
    }

    // Valid mobile check
    if (!isMobilePhoneNumber(inputValue)) {
      return 'Please enter a valid mobile number'
    }

    return true
  }
