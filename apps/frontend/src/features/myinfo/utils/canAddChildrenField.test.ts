import { FormResponseMode } from 'formsg-shared/types'
import { describe, expect, it } from 'vitest'

import { canAddChildrenField } from './canAddChildrenField'

describe('canAddChildrenField', () => {
  it('allows children in Encrypt mode with the beta flag', () => {
    expect(
      canAddChildrenField({
        hasChildrenBetaFlag: true,
        responseMode: FormResponseMode.Encrypt,
      }),
    ).toBe(true)
  })

  it('allows children in Multi-respondent mode with the beta flag (v2 is the default there)', () => {
    expect(
      canAddChildrenField({
        hasChildrenBetaFlag: true,
        responseMode: FormResponseMode.Multirespondent,
      }),
    ).toBe(true)
  })

  it('hides children without the beta flag, regardless of mode', () => {
    expect(
      canAddChildrenField({
        hasChildrenBetaFlag: false,
        responseMode: FormResponseMode.Multirespondent,
      }),
    ).toBe(false)
  })

  it('hides children in unsupported modes (e.g. Email)', () => {
    expect(
      canAddChildrenField({
        hasChildrenBetaFlag: true,
        responseMode: FormResponseMode.Email,
      }),
    ).toBe(false)
  })
})
