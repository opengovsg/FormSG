import {
  BasicField,
  ChildrenCompoundFieldBase,
  ChildrenFieldVersion,
} from 'formsg-shared/types'
import { describe, expect, it } from 'vitest'

import { REQUIRED_ERROR } from '~constants/validation'

import { createChildrenValidationRules } from '../fieldValidation'

const childrenSchema = (
  overrides: Partial<ChildrenCompoundFieldBase> = {},
): ChildrenCompoundFieldBase => ({
  title: 'Children',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Children,
  ...overrides,
})

const requiredValidatorOf = (schema: ChildrenCompoundFieldBase) => {
  const rules = createChildrenValidationRules(schema, false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rules.validate as any).required as (value: string) => unknown
}

describe('createChildrenValidationRules', () => {
  it('does not require an empty sub-field for a version-2 field', () => {
    const required = requiredValidatorOf(
      childrenSchema({ version: ChildrenFieldVersion.V2 }),
    )

    expect(required('')).toBe(true)
  })

  it('still requires a non-empty sub-field for a legacy required field', () => {
    const required = requiredValidatorOf(childrenSchema())

    expect(required('')).toBe(REQUIRED_ERROR)
  })

  it('accepts a populated sub-field for a version-2 field', () => {
    const required = requiredValidatorOf(
      childrenSchema({ version: ChildrenFieldVersion.V2 }),
    )

    expect(required('CHINESE')).toBe(true)
  })
})
