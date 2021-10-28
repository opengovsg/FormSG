/**
 * This utility file creates validation rules for `react-hook-form` according
 * to the field schema.
 */
import { RegisterOptions } from 'react-hook-form'
import simplur from 'simplur'
import validator from 'validator'

import {
  EmailFieldBase,
  FieldBase,
  HomenoFieldBase,
  NricFieldBase,
  NumberFieldBase,
  NumberSelectedValidation,
  RatingFieldBase,
  ShortTextFieldBase,
  TextSelectedValidation,
  UenFieldBase,
} from '~shared/types/field'
import { isNricValid } from '~shared/utils/nric-validation'
import { isHomePhoneNumber } from '~shared/utils/phone-num-validation'
import { isUenValid } from '~shared/utils/uen-validation'

import {
  INVALID_EMAIL_DOMAIN_ERROR,
  INVALID_EMAIL_ERROR,
  REQUIRED_ERROR,
} from '~constants/validation'

const createRequiredValidationRules = (schema: FieldBase) => {
  return {
    value: schema.required,
    message: REQUIRED_ERROR,
  }
}

const createRequiredInValidationRules = (schema: FieldBase) => {
  return {
    required: (value: unknown) => {
      if (!schema.required) return true
      return !!value || REQUIRED_ERROR
    },
  }
}

export const createBaseValidationRules = (
  schema: FieldBase,
): RegisterOptions => {
  return {
    required: createRequiredValidationRules(schema),
  }
}

export const createRatingValidationRules = (
  schema: RatingFieldBase,
): RegisterOptions => {
  return {
    validate: {
      ...createRequiredInValidationRules(schema),
    },
  }
}

export const createHomeNoValidationRules = (
  schema: HomenoFieldBase,
): RegisterOptions => {
  return {
    ...createBaseValidationRules(schema),
    validate: (val?: string) => {
      if (!val) return true
      return isHomePhoneNumber(val) || 'Please enter a valid landline number'
    },
  }
}

export const createNumberValidationRules = (
  schema: NumberFieldBase,
): RegisterOptions => {
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

export const createShortTextValidationRules = (
  schema: ShortTextFieldBase,
): RegisterOptions => {
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

export const createUenValidationRules = (
  schema: UenFieldBase,
): RegisterOptions => {
  return {
    ...createBaseValidationRules(schema),
    validate: (val?: string) => {
      if (!val) return true
      return isUenValid(val) || 'Please enter a valid UEN'
    },
  }
}

export const createNricValidationRules = (
  schema: NricFieldBase,
): RegisterOptions => {
  return {
    ...createBaseValidationRules(schema),
    validate: (val?: string) => {
      if (!val) return true
      return isNricValid(val) || 'Please enter a valid NRIC'
    },
  }
}

export const createEmailValidationRules = (
  schema: EmailFieldBase,
): RegisterOptions => {
  const allowedDomains = schema.isVerifiable
    ? new Set(schema.allowedEmailDomains)
    : new Set()

  return {
    ...createBaseValidationRules(schema),
    validate: {
      validEmail: (val?: string) => {
        if (!val) return true
        return validator.isEmail(val) || INVALID_EMAIL_ERROR
      },
      validDomain: (val?: string) => {
        // Return if no value, or has no whitelisted domains at all.
        if (!val || allowedDomains.size === 0) return true

        const domainInValue = val.split('@')[1]

        return (
          (domainInValue && allowedDomains.has(`@${domainInValue}`)) ||
          INVALID_EMAIL_DOMAIN_ERROR
        )
      },
    },
  }
}
