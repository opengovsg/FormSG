/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * This utility file creates validation rules for `react-hook-form` according
 * to the field schema.
 */
import { FieldValues, RegisterOptions, UseFormGetValues } from 'react-hook-form'

import { FieldBase } from '~shared/types/field'
import { isMobilePhoneNumber } from '~shared/utils/phone-num-validation'

import { MobileFieldSchema } from '~/templates/Field/Mobile/MobileField'

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

export const createMobileValidationRules = (
  schema: MobileFieldSchema,
): RegisterOptions => {
  return {
    ...createBaseValidationRules(schema),
    validate: {
      validPhoneNumber: (val) => {
        return !val || isMobilePhoneNumber(val) || 'Invalid number'
      },
    },
  }
}
