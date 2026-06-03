import { composeEscapeHatchCopy } from '../escapeHatchCopy'

describe('composeEscapeHatchCopy', () => {
  it('returns payments-only copy when no extra flags are set', () => {
    expect(composeEscapeHatchCopy()).toEqual({
      prefix: 'Need payments? Use the ',
      linkText: 'old version of FormSG',
      suffix: '.',
    })
  })

  it('mentions MyInfo children fields when children flag is set', () => {
    expect(composeEscapeHatchCopy({ children: true }).prefix).toBe(
      'Need payments or MyInfo children fields? Use the ',
    )
  })

  it('mentions webhooks v1 when createStorageModeForV1Webhook flag is set', () => {
    expect(
      composeEscapeHatchCopy({ createStorageModeForV1Webhook: true }).prefix,
    ).toBe('Need payments or webhooks v1? Use the ')
  })

  it('composes all reasons when both flags are set', () => {
    expect(
      composeEscapeHatchCopy({
        children: true,
        createStorageModeForV1Webhook: true,
      }).prefix,
    ).toBe('Need payments, MyInfo children fields, or webhooks v1? Use the ')
  })

  it('ignores unrelated falsy flags', () => {
    expect(
      composeEscapeHatchCopy({
        children: false,
        createStorageModeForV1Webhook: false,
      }).prefix,
    ).toBe('Need payments? Use the ')
  })
})
