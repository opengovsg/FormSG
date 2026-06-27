import { BasicField } from '../base'
import {
  ChildrenCompoundFieldBase,
  ChildrenFieldVersion,
  isChildrenV2Field,
} from '../childrenCompoundField'

const baseChildrenField = (
  overrides: Partial<ChildrenCompoundFieldBase> = {},
): ChildrenCompoundFieldBase => ({
  globalId: 'g1',
  title: 'Children',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Children,
  ...overrides,
})

describe('isChildrenV2Field', () => {
  it('returns true for a children field stamped version 2', () => {
    const field = baseChildrenField({ version: ChildrenFieldVersion.V2 })

    expect(isChildrenV2Field(field)).toBe(true)
  })

  it('returns false for a legacy children field with version 1', () => {
    const field = baseChildrenField({ version: ChildrenFieldVersion.Legacy })

    expect(isChildrenV2Field(field)).toBe(false)
  })

  it('treats an unversioned children field as legacy (not v2)', () => {
    const field = baseChildrenField()

    expect(isChildrenV2Field(field)).toBe(false)
  })

  it('returns false for a non-children field', () => {
    const field = {
      ...baseChildrenField(),
      fieldType: BasicField.ShortText,
    }

    expect(isChildrenV2Field(field)).toBe(false)
  })
})
