/**
 * This utility file creates validation rules for `react-hook-form` according
 * to the field schema.
 */
import { RegisterOptions } from 'react-hook-form'
import simplur from 'simplur'

import {
  FieldBase,
  NricFieldBase,
  ShortTextFieldBase,
  TextSelectedValidation,
} from '~shared/types/field'
import { isNricValid } from '~shared/utils/nric-validation'

import { REQUIRED_ERROR } from '~constants/validation'

export const createBaseValidationRules = (
  schema: FieldBase,
): RegisterOptions => {
  return {
    required: {
      value: schema.required,
      message: REQUIRED_ERROR,
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
