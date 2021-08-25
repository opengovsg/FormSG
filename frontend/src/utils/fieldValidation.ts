/**
 * This utility file creates validation rules for `react-hook-form` according
 * to the field schema.
 */
import { RegisterOptions } from 'react-hook-form'

import { FieldBase } from '~shared/types/field'

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
