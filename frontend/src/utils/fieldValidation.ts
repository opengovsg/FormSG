/**
 * This utility file creates validation rules for `react-hook-form` according
 * to the field schema.
 */
import { useMemo } from 'react'
import {
  FieldValues,
  Path,
  RegisterOptions,
  UseFormGetValues,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { isValid, parse } from 'date-fns'
import { TFunction } from 'i18next'
import { identity } from 'lodash'
import simplur from 'simplur'
import validator from 'validator'

import { DATE_PARSE_FORMAT } from '~shared/constants/dates'
import {
  AddressCompoundFieldBase,
  AttachmentFieldBase,
  BasicField,
  CheckboxFieldBase,
  ChildrenCompoundFieldBase,
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
  NumberSelectedLengthValidation,
  NumberSelectedValidation,
  RadioFieldBase,
  RatingFieldBase,
  ShortTextFieldBase,
  TextSelectedValidation,
  UenFieldBase,
} from '~shared/types/field'
import {
  validateLevelUnit,
  validateNoNonNumerical,
  validateNoSpecialCharacters,
  validatePostalCode,
} from '~shared/utils/address-validation'
import { isDateAnInvalidDay } from '~shared/utils/date-validation'
import { isMFinSeriesValid, isNricValid } from '~shared/utils/nric-validation'
import {
  isHomePhoneNumber,
  isMobilePhoneNumber,
} from '~shared/utils/phone-num-validation'
import { isUenValid } from '~shared/utils/uen-validation'

import { Fields } from '~/i18n/locales/features/public-form/fields'

import {
  INVALID_BLOCK_UNIT_ERROR,
  INVALID_EMAIL_ERROR,
  INVALID_LEVEL_UNIT_ERROR,
  INVALID_NON_NUMERICAL_ERROR,
  REQUIRED_ERROR,
} from '~constants/validation'
import {
  AddressCompoundFieldInput,
  CheckboxFieldValues,
  SingleAnswerValue,
  VerifiableFieldValues,
} from '~templates/Field/types'

import { VerifiableFieldBase } from '~features/verifiable-fields/types'

import {
  isDateAfterToday,
  isDateBeforeToday,
  isDateOutOfRange,
  loadDateFromNormalizedDate,
} from './date'
import { formatNumberToLocaleString } from './stringFormat'

type EmailValidationErrorMessages = Fields['email']['validation']

// Omit unused props
type MinimumFieldValidationProps<T extends FieldBase> = Omit<
  T,
  'fieldType' | 'description' | 'disabled'
>

// fieldType is only used in email and mobile field verification, so we don't omit it
type MinimumFieldValidationPropsEmailAndMobile<T extends FieldBase> = Omit<
  T,
  'description' | 'disabled'
>

type ValidationRuleFn<T extends FieldBase = FieldBase> = (
  schema: MinimumFieldValidationProps<T>,
  disableRequiredValidation?: boolean,
) => RegisterOptions

type ValidationRuleFnEmailAndMobile<T extends FieldBase = FieldBase> = (
  schema: MinimumFieldValidationPropsEmailAndMobile<T>,
  disableRequiredValidation?: boolean,
  validationErrorMessages?: EmailValidationErrorMessages,
) => RegisterOptions

type ValidationRuleFnUnitAndLevelNo<T extends FieldBase = FieldBase> = (
  schema: MinimumFieldValidationProps<T> & { _id: string },
  getValues: UseFormGetValues<AddressCompoundFieldInput>,
) => RegisterOptions

const I18N_KEY_PREFIX = 'utils.fieldValidation'

const requiredSingleAnswerValidationFn =
  (
    schema: Pick<FieldBase, 'required'>,
    disableRequiredValidation?: boolean,
    t?: TFunction,
  ) =>
  (value?: SingleAnswerValue) => {
    if (disableRequiredValidation || !schema.required) return true
    // TODO: migrate REQUIRED_ERROR to point to 'required' instead of 'This field is required'
    const errorMessage = t ? t('required') : REQUIRED_ERROR
    return !!value?.trim() || errorMessage
  }

/**
 * Validation rules for verifiable fields.
 * @param schema verifiable field schema
 * @returns base verifiable fields' validation rules
 */
const createBaseVfnFieldValidationRules: ValidationRuleFnEmailAndMobile<
  VerifiableFieldBase
> = (schema, disableRequiredValidation): RegisterOptions => {
  return {
    validate: {
      required: (value?: VerifiableFieldValues) => {
        return requiredSingleAnswerValidationFn(
          schema,
          disableRequiredValidation,
        )(value?.value)
      },
      hasSignature: (val?: VerifiableFieldValues) => {
        if (!schema.isVerifiable) return true
        // Either signature is filled, or both fields have no input.
        if (!!val?.signature || (!val?.value && !val?.signature)) {
          return true
        }
        if (schema.fieldType === BasicField.Mobile) {
          return 'Please verify your mobile number'
        }
        if (schema.fieldType === BasicField.Email) {
          return 'Please verify your email address'
        }
      },
    },
  }
}

const useBaseVfnFieldValidationRules: ValidationRuleFnEmailAndMobile<
  VerifiableFieldBase
> = (schema, disableRequiredValidation): RegisterOptions => {
  const { t } = useTranslation('translation', {
    keyPrefix: I18N_KEY_PREFIX,
  })

  return useMemo(() => {
    return {
      validate: {
        required: (value?: VerifiableFieldValues) => {
          return requiredSingleAnswerValidationFn(
            schema,
            disableRequiredValidation,
            t,
          )(value?.value)
        },
        hasSignature: (val?: VerifiableFieldValues) => {
          if (!schema.isVerifiable) return true
          // Either signature is filled, or both fields have no input.
          if (!!val?.signature || (!val?.value && !val?.signature)) {
            return true
          }
          if (schema.fieldType === BasicField.Mobile) {
            return 'Please verify your mobile number'
          }
          if (schema.fieldType === BasicField.Email) {
            return t('pleaseVerifyEmail')
          }
        },
      },
    }
  }, [schema, disableRequiredValidation, t])
}

// TODO: remove after useBaseValidationRules is used instead. keeping this for backward compatibility
export const createBaseValidationRules = <
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends Path<TFieldValues> = never,
>(
  schema: Pick<FieldBase, 'required'>,
  disableRequiredValidation?: boolean,
): RegisterOptions<TFieldValues, TFieldName> => {
  return {
    validate: requiredSingleAnswerValidationFn(
      schema,
      disableRequiredValidation,
    ),
  }
}

// Hook version using i18n
const useBaseValidationRules = <
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends Path<TFieldValues> = never,
>(
  schema: Pick<FieldBase, 'required'>,
  disableRequiredValidation?: boolean,
): RegisterOptions<TFieldValues, TFieldName> => {
  const { t } = useTranslation('translation', {
    keyPrefix: I18N_KEY_PREFIX,
  })

  return useMemo(() => {
    return {
      validate: {
        required: requiredSingleAnswerValidationFn(
          schema,
          disableRequiredValidation,
          t,
        ),
      },
    }
  }, [schema, disableRequiredValidation, t])
}

export const useDropdownValidationRules: ValidationRuleFn<DropdownFieldBase> = (
  schema,
  disableRequiredValidation,
): RegisterOptions => {
  return createDropdownValidationRulesWithCustomErrorMessage(
    'invalidDropdownOption',
  )(schema, disableRequiredValidation)
}

export const useCountryRegionValidationRules: ValidationRuleFn<
  DropdownFieldBase
> = (schema, disableRequiredValidation): RegisterOptions => {
  return createDropdownValidationRulesWithCustomErrorMessage(
    'invalidCountryRegion',
  )(schema, disableRequiredValidation)
}

const createDropdownValidationRulesWithCustomErrorMessage: (
  errorKey: 'invalidDropdownOption' | 'invalidCountryRegion',
) => ValidationRuleFn<DropdownFieldBase> =
  (errorKey) =>
  (schema, disableRequiredValidation): RegisterOptions => {
    const { t } = useTranslation('translation', {
      keyPrefix: I18N_KEY_PREFIX,
    })

    return useMemo(() => {
      return {
        validate: {
          required: requiredSingleAnswerValidationFn(
            schema,
            disableRequiredValidation,
            t,
          ),
          validOptions: (value: string) => {
            if (!value) return true
            return schema.fieldOptions.includes(value) || t(errorKey)
          },
        },
      }
    }, [schema, disableRequiredValidation, t])
  }

export const useRatingValidationRules: ValidationRuleFn<RatingFieldBase> = (
  schema,
  disableRequiredValidation,
): RegisterOptions => {
  return useBaseValidationRules(schema, disableRequiredValidation)
}

export const useAttachmentValidationRules: ValidationRuleFn<
  AttachmentFieldBase
> = (schema, disableRequiredValidation): RegisterOptions => {
  return useBaseValidationRules(schema, disableRequiredValidation)
}

export const createHomeNoValidationRules: ValidationRuleFn<HomenoFieldBase> = (
  schema,
  disableRequiredValidation,
): RegisterOptions => {
  return {
    validate: {
      required: requiredSingleAnswerValidationFn(
        schema,
        disableRequiredValidation,
      ),
      validHomeNo: (val?: string) => {
        if (!val) return true
        return isHomePhoneNumber(val) || 'Please enter a valid landline number'
      },
    },
  }
}

// i18n this next
export const createPostalCodeValidationRules: ValidationRuleFn<
  AddressCompoundFieldBase
> = (schema, disableRequiredValidation): RegisterOptions => {
  return {
    validate: {
      required: requiredSingleAnswerValidationFn(
        schema,
        disableRequiredValidation,
      ),
      validOnlyNumbers: (value: string) => {
        if (value === '') return true
        return validateNoNonNumerical(value) || INVALID_NON_NUMERICAL_ERROR
      },
      validPostalCode: (value: string) => {
        if (value === '') return true
        return validatePostalCode(value) || 'Please enter a valid postal code'
      },
    },
  }
}

export const createBlockNumberValidationRules: ValidationRuleFn<
  AddressCompoundFieldBase
> = (schema, disableRequiredValidation): RegisterOptions => {
  return {
    validate: {
      required: requiredSingleAnswerValidationFn(
        schema,
        disableRequiredValidation,
      ),
      validBlock: (value: string) => {
        if (value === '') return true
        return validateNoSpecialCharacters(value) || INVALID_BLOCK_UNIT_ERROR
      },
    },
  }
}

export const createStreetNameValidationRules: ValidationRuleFn<
  AddressCompoundFieldBase
> = (schema, disableRequiredValidation): RegisterOptions => {
  return {
    validate: {
      required: requiredSingleAnswerValidationFn(
        schema,
        disableRequiredValidation,
      ),
    },
  }
}

export const createLevelNumberValidationRules: ValidationRuleFnUnitAndLevelNo<
  AddressCompoundFieldBase
> = (
  schema,
  getValues: UseFormGetValues<AddressCompoundFieldInput>,
): RegisterOptions => {
  return {
    validate: {
      validLevel: (value: string) => {
        if (value === '') return true
        return validateNoNonNumerical(value) || INVALID_NON_NUMERICAL_ERROR
      },
      validInput: () => {
        if (!getValues) return true
        const levelNo = getValues(`${schema._id}.addressSubFields.levelNumber`)
        const unitNo = getValues(`${schema._id}.addressSubFields.unitNumber`)
        return validateLevelUnit(levelNo, unitNo) || INVALID_LEVEL_UNIT_ERROR
      },
    },
  }
}

export const createUnitNumberValidationRules: ValidationRuleFnUnitAndLevelNo<
  AddressCompoundFieldBase
> = (
  schema,
  getValues: UseFormGetValues<AddressCompoundFieldInput>,
): RegisterOptions => {
  return {
    validate: {
      validUnit: (value: string) => {
        if (value === '') return true
        return validateNoSpecialCharacters(value) || INVALID_BLOCK_UNIT_ERROR
      },
      validInput: () => {
        if (!getValues) return true
        const unitNo = getValues(`${schema._id}.addressSubFields.unitNumber`)
        const levelNo = getValues(`${schema._id}.addressSubFields.levelNumber`)
        return validateLevelUnit(unitNo, levelNo) || INVALID_LEVEL_UNIT_ERROR
      },
    },
  }
}

export const createMobileValidationRules: ValidationRuleFnEmailAndMobile<
  MobileFieldBase
> = (schema, disableRequiredValidation): RegisterOptions => {
  return {
    validate: {
      baseValidations: (val?: VerifiableFieldValues) => {
        return baseMobileValidationFn(schema)(val?.value)
      },
      ...createBaseVfnFieldValidationRules(schema, disableRequiredValidation)
        .validate,
    },
  }
}

export const useNumberValidationRules = (
  schema: NumberFieldBase,
  disableRequiredValidation?: boolean,
): RegisterOptions => {
  const { t } = useTranslation('translation', {
    keyPrefix: I18N_KEY_PREFIX,
  })

  return useMemo(() => {
    const { selectedValidation } = schema.ValidationOptions
    const { selectedLengthValidation, customVal } =
      schema.ValidationOptions.LengthValidationOptions
    const { customMin, customMax } =
      schema.ValidationOptions.RangeValidationOptions

    return {
      validate: {
        required: requiredSingleAnswerValidationFn(
          schema,
          disableRequiredValidation,
          t,
        ),
        validNumberLength: (val: string) => {
          if (
            selectedValidation !== NumberSelectedValidation.Length ||
            !val ||
            !customVal
          )
            return true

          const currLen = val.trim().length

          switch (selectedLengthValidation) {
            case NumberSelectedLengthValidation.Exact:
              return (
                currLen === customVal ||
                t('exactDigits', {
                  current: currLen,
                  threshold: customVal,
                })
              )
            case NumberSelectedLengthValidation.Min:
              return (
                currLen >= customVal ||
                t('minDigits', {
                  current: currLen,
                  threshold: customVal,
                })
              )
            case NumberSelectedLengthValidation.Max:
              return (
                currLen <= customVal ||
                t('maxDigits', {
                  current: currLen,
                  threshold: customVal,
                })
              )
          }
        },
        validNumberRange: (val: string) => {
          if (selectedValidation !== NumberSelectedValidation.Range || !val)
            return true

          const numVal = parseInt(val)
          if (Number.isNaN(numVal)) {
            return t('validNumber')
          }

          const hasMinimum = customMin !== null
          const hasMaximum = customMax !== null
          const satisfiesMinimum = !hasMinimum || customMin <= numVal
          const satisfiesMaximum = !hasMaximum || numVal <= customMax
          const isInRange = satisfiesMinimum && satisfiesMaximum

          if (isInRange) {
            return true
          } else if (hasMinimum && hasMaximum) {
            return t('numbersRange', {
              min: customMin,
              max: customMax,
            })
          } else if (hasMinimum) {
            return t('numberMinimum', { min: customMin })
          } else if (hasMaximum) {
            return t('numberMaximum', { max: customMax })
          }
        },
      },
    }
  }, [schema, disableRequiredValidation, t])
}

export const useDecimalValidationRules = (
  schema: DecimalFieldBase,
  disableRequiredValidation?: boolean,
): RegisterOptions => {
  const { t } = useTranslation('translation', {
    keyPrefix: I18N_KEY_PREFIX,
  })

  return useMemo(() => {
    const {
      ValidationOptions: { customMax, customMin },
      validateByValue,
    } = schema

    return {
      validate: {
        required: requiredSingleAnswerValidationFn(
          schema,
          disableRequiredValidation,
          t,
        ),
        validDecimal: (val: string) => {
          if (!val) return true

          const numVal = Number(val)
          if (isNaN(numVal)) {
            return t('validDecimal')
          }

          // Validate leading zeros
          if (/^0[0-9]/.test(val)) {
            return t('validDecimalNoLeadingZeros')
          }

          if (!validateByValue) return true

          if (
            customMin !== null &&
            customMax !== null &&
            (numVal < customMin || numVal > customMax)
          ) {
            return t('decimalRange', {
              min: formatNumberToLocaleString(customMin),
              max: formatNumberToLocaleString(customMax),
            })
          }
          if (customMin !== null && numVal < customMin) {
            return t('decimalMinimum', {
              min: formatNumberToLocaleString(customMin),
            })
          }
          if (customMax !== null && numVal > customMax) {
            return t('decimalMaximum', {
              max: formatNumberToLocaleString(customMax),
            })
          }

          return true
        },
      },
    }
  }, [schema, disableRequiredValidation, t])
}

export const useTextValidationRules = (
  schema: ShortTextFieldBase | LongTextFieldBase,
  disableRequiredValidation?: boolean,
): RegisterOptions => {
  const { t } = useTranslation('translation', {
    keyPrefix: I18N_KEY_PREFIX,
  })

  return useMemo(() => {
    const { selectedValidation, customVal } = schema.ValidationOptions

    return {
      validate: {
        required: requiredSingleAnswerValidationFn(
          schema,
          disableRequiredValidation,
          t,
        ),
        validText: (val?: string) => {
          if (!val || !customVal) return true

          const currLen = val.trim().length

          switch (selectedValidation) {
            case TextSelectedValidation.Exact:
              return (
                currLen === customVal ||
                t('exactCharacters', {
                  current: currLen,
                  threshold: customVal,
                })
              )
            case TextSelectedValidation.Minimum:
              return (
                currLen >= customVal ||
                t('minCharacters', {
                  current: currLen,
                  threshold: customVal,
                })
              )
            case TextSelectedValidation.Maximum:
              return (
                currLen <= customVal ||
                t('maxCharacters', {
                  current: currLen,
                  threshold: customVal,
                })
              )
          }
        },
      },
    }
  }, [schema, disableRequiredValidation, t])
}

export const useUenValidationRules = (
  schema: UenFieldBase,
  disableRequiredValidation?: boolean,
): RegisterOptions => {
  const { t } = useTranslation('translation', {
    keyPrefix: I18N_KEY_PREFIX,
  })

  return useMemo(() => {
    return {
      validate: {
        required: requiredSingleAnswerValidationFn(
          schema,
          disableRequiredValidation,
          t,
        ),
        validUen: (val?: string) => {
          if (!val) return true
          return isUenValid(val) || t('validUen')
        },
      },
    }
  }, [schema, disableRequiredValidation, t])
}

export const useNricValidationRules = (
  schema: NricFieldBase,
  disableRequiredValidation?: boolean,
): RegisterOptions => {
  const { t } = useTranslation('translation', {
    keyPrefix: I18N_KEY_PREFIX,
  })

  return useMemo(() => {
    return {
      validate: {
        required: requiredSingleAnswerValidationFn(
          schema,
          disableRequiredValidation,
          t,
        ),
        validNric: (val?: string) => {
          if (!val) return true
          return isNricValid(val) || isMFinSeriesValid(val) || t('validNric')
        },
      },
    }
  }, [schema, disableRequiredValidation, t])
}

export const useCheckboxValidationRules = (
  schema: CheckboxFieldBase,
  disableRequiredValidation?: boolean,
): RegisterOptions => {
  const { t } = useTranslation('translation', {
    keyPrefix: I18N_KEY_PREFIX,
  })

  return useMemo(() => {
    const {
      ValidationOptions: { customMin, customMax },
      validateByValue,
    } = schema

    return {
      validate: {
        required: (val?: CheckboxFieldValues['value']) => {
          if (disableRequiredValidation || !schema.required) return true
          if (!val) return t('required')
          // Trim strings before checking for emptiness
          return val.map((v) => v.trim()).some(identity) || t('required')
        },
        validOptions: (val?: CheckboxFieldValues['value']) => {
          if (!val || val.length === 0 || !validateByValue) return true

          if (
            customMin &&
            customMax &&
            customMin === customMax &&
            val.length !== customMin
          ) {
            return t('exactOptions', {
              current: val.length,
              threshold: customMin,
            })
          }

          if (customMin && val.length < customMin) {
            return t('minOptions', {
              current: val.length,
              threshold: customMin,
            })
          }

          if (customMax && val.length > customMax) {
            return t('maxOptions', {
              current: val.length,
              threshold: customMax,
            })
          }

          return true
        },
      },
    }
  }, [schema, disableRequiredValidation, t])
}

const parseDate = (val: string) => {
  return parse(val, DATE_PARSE_FORMAT, new Date())
}

export const useDateValidationRules = (
  schema: DateFieldBase,
  disableRequiredValidation?: boolean,
): RegisterOptions => {
  const { t } = useTranslation('translation', {
    keyPrefix: I18N_KEY_PREFIX,
  })

  return useMemo(() => {
    return {
      validate: {
        required: requiredSingleAnswerValidationFn(
          schema,
          disableRequiredValidation,
          t,
        ),
        validDate: (val) => {
          if (!val) return true
          if (val === DATE_PARSE_FORMAT.toLowerCase()) {
            return t('required')
          }
          return isValid(parseDate(val)) || t('validDate')
        },
        noFuture: (val) => {
          if (
            !val ||
            schema.dateValidation.selectedDateValidation !==
              DateSelectedValidation.NoFuture
          ) {
            return true
          }
          return !isDateAfterToday(parseDate(val)) || t('noFutureDate')
        },
        noPast: (val) => {
          if (
            !val ||
            schema.dateValidation.selectedDateValidation !==
              DateSelectedValidation.NoPast
          ) {
            return true
          }
          return !isDateBeforeToday(parseDate(val)) || t('noPastDate')
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
            !isDateOutOfRange(
              parseDate(val),
              loadDateFromNormalizedDate(customMinDate),
              loadDateFromNormalizedDate(customMaxDate),
            ) || t('dateOutOfRange')
          )
        },
        invalidDays: (val) =>
          !val ||
          !schema.invalidDays ||
          !schema.invalidDays.length ||
          !isDateAnInvalidDay(parseDate(val), schema.invalidDays) ||
          t('invalidDay'),
      },
    }
  }, [schema, disableRequiredValidation, t])
}

export const useRadioValidationRules: ValidationRuleFn<RadioFieldBase> = (
  schema,
  disableRequiredValidation,
): RegisterOptions => {
  return useBaseValidationRules(schema, disableRequiredValidation)
}

export const useEmailValidationRules: ValidationRuleFnEmailAndMobile<
  EmailFieldBase
> = (
  schema,
  disableRequiredValidation,
  validationErrorMessages,
): RegisterOptions => {
  const { t } = useTranslation('translation', {
    keyPrefix: I18N_KEY_PREFIX,
  })

  const baseVfnRules = useBaseVfnFieldValidationRules(
    schema,
    disableRequiredValidation,
  )

  return useMemo(() => {
    return {
      validate: {
        baseValidations: (val?: VerifiableFieldValues) => {
          return baseEmailValidationFn({
            schema,
            t,
            validationErrorMessages,
          })(val?.value)
        },
        ...baseVfnRules.validate,
      },
    }
  }, [baseVfnRules.validate, schema, t, validationErrorMessages])
}

/**
 * To be shared between the verifiable and non-verifiable variant.
 * @returns error string if field is invalid, true otherwise.
 */
export const baseEmailValidationFn =
  ({
    schema,
    t,
    validationErrorMessages = { domainDisallowed: 'Domain disallowed' },
  }: {
    schema: MinimumFieldValidationProps<EmailFieldBase>
    t?: TFunction
    validationErrorMessages?: EmailValidationErrorMessages
  }) =>
  (inputValue?: string) => {
    if (!inputValue) return true

    const trimmedInputValue = inputValue.trim()

    // Valid email check
    if (!validator.isEmail(trimmedInputValue))
      return t ? t('invalidEmail') : INVALID_EMAIL_ERROR

    // Valid domain check
    const allowedDomains = new Set(schema.allowedEmailDomains)
    if (allowedDomains.size !== 0) {
      const domainInValue = trimmedInputValue.split('@')[1].toLowerCase()
      if (domainInValue && !allowedDomains.has(`@${domainInValue}`)) {
        return validationErrorMessages.domainDisallowed
      }
    }

    // Passed all error validation.
    return true
  }

export const baseMobileValidationFn =
  (_schema: MinimumFieldValidationProps<MobileFieldBase>) =>
  (inputValue?: string) => {
    if (!inputValue) return true

    // Valid mobile check
    return (
      isMobilePhoneNumber(inputValue) || 'Please enter a valid mobile number'
    )
  }

export const createChildrenValidationRules: ValidationRuleFn<
  ChildrenCompoundFieldBase
> = (schema, disableRequiredValidation): RegisterOptions => {
  return {
    validate: {
      required: (value: string) => {
        if (disableRequiredValidation || !schema.required) return true
        if (!value || !value.trim()) return REQUIRED_ERROR
      },
    },
  }
}
