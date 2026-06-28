import { FormResponseMode } from 'formsg-shared/types'
import { describe, expect, it } from 'vitest'

import { canAddChildrenField } from './canAddChildrenField'

describe('canAddChildrenField', () => {
  it('allows children in Encrypt mode with the beta flag (v2 irrelevant)', () => {
    expect(
      canAddChildrenField({
        hasChildrenBetaFlag: true,
        responseMode: FormResponseMode.Encrypt,
        isChildrenV2Enabled: false,
      }),
    ).toBe(true)
  })

  it('allows children in Multi-respondent mode only when v2 is enabled', () => {
    expect(
      canAddChildrenField({
        hasChildrenBetaFlag: true,
        responseMode: FormResponseMode.Multirespondent,
        isChildrenV2Enabled: true,
      }),
    ).toBe(true)
  })

  it('hides children in Multi-respondent mode when v2 is disabled', () => {
    expect(
      canAddChildrenField({
        hasChildrenBetaFlag: true,
        responseMode: FormResponseMode.Multirespondent,
        isChildrenV2Enabled: false,
      }),
    ).toBe(false)
  })

  it('hides children without the beta flag, regardless of mode', () => {
    expect(
      canAddChildrenField({
        hasChildrenBetaFlag: false,
        responseMode: FormResponseMode.Encrypt,
        isChildrenV2Enabled: true,
      }),
    ).toBe(false)
  })

  it('hides children in unsupported modes (e.g. Email)', () => {
    expect(
      canAddChildrenField({
        hasChildrenBetaFlag: true,
        responseMode: FormResponseMode.Email,
        isChildrenV2Enabled: true,
      }),
    ).toBe(false)
  })
})
