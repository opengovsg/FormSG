import {
  BasicField,
  ChildrenFieldVersion,
  FormResponseMode,
} from 'formsg-shared/types'
import { describe, expect, it } from 'vitest'

import { isChildrenV2InBuilder } from './isChildrenV2InBuilder'

describe('isChildrenV2InBuilder', () => {
  it('is true for a children field already stamped v2 (Encrypt)', () => {
    expect(
      isChildrenV2InBuilder(
        { fieldType: BasicField.Children, version: ChildrenFieldVersion.V2 },
        FormResponseMode.Encrypt,
      ),
    ).toBe(true)
  })

  it('is true for a children field on a Multi-respondent form even before it is stamped', () => {
    expect(
      isChildrenV2InBuilder(
        { fieldType: BasicField.Children },
        FormResponseMode.Multirespondent,
      ),
    ).toBe(true)
  })

  it('is false for an unstamped children field on Encrypt', () => {
    expect(
      isChildrenV2InBuilder(
        { fieldType: BasicField.Children },
        FormResponseMode.Encrypt,
      ),
    ).toBe(false)
  })

  it('is false for a non-children field, even on Multi-respondent', () => {
    expect(
      isChildrenV2InBuilder(
        { fieldType: BasicField.ShortText },
        FormResponseMode.Multirespondent,
      ),
    ).toBe(false)
  })
})
