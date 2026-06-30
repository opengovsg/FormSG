import { describe, expect, it } from 'vitest'

import { FormResponseMode } from 'formsg-shared/types'

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

  it('hides children without the beta flag', () => {
    expect(
      canAddChildrenField({
        hasChildrenBetaFlag: false,
        responseMode: FormResponseMode.Encrypt,
      }),
    ).toBe(false)
  })

  it('hides children in Multi-respondent mode (arrives with MRF support)', () => {
    expect(
      canAddChildrenField({
        hasChildrenBetaFlag: true,
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
