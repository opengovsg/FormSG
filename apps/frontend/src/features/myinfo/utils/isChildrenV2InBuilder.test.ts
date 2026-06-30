import { describe, expect, it } from 'vitest'

import { BasicField, ChildrenFieldVersion } from 'formsg-shared/types'

import { isChildrenV2InBuilder } from './isChildrenV2InBuilder'

describe('isChildrenV2InBuilder', () => {
  it('is true for a children field stamped v2', () => {
    expect(
      isChildrenV2InBuilder({
        fieldType: BasicField.Children,
        version: ChildrenFieldVersion.V2,
      }),
    ).toBe(true)
  })

  it('is false for an unstamped children field', () => {
    expect(isChildrenV2InBuilder({ fieldType: BasicField.Children })).toBe(
      false,
    )
  })

  it('is false for a version-1 (legacy) children field', () => {
    expect(
      isChildrenV2InBuilder({
        fieldType: BasicField.Children,
        version: ChildrenFieldVersion.Legacy,
      }),
    ).toBe(false)
  })

  it('is false for a non-children field', () => {
    expect(
      isChildrenV2InBuilder({
        fieldType: BasicField.ShortText,
        version: ChildrenFieldVersion.V2,
      }),
    ).toBe(false)
  })
})
