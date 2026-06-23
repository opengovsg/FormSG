import { TFunction } from 'i18next'

import { composeEscapeHatchCopy } from '../escapeHatchCopy'

const KEY = 'features.workspace.modals.forms.create.escapeHatch'

// Mimic the en-sg locale values + i18next interpolation so the assertions
// check the exact composed copy.
const EN: Record<string, string> = {
  [`${KEY}.reasons.payments`]: 'payments',
  [`${KEY}.reasons.children`]: 'Myinfo Children fields',
  [`${KEY}.reasons.webhooksV1`]: 'webhooks v1',
  [`${KEY}.linkText`]: 'legacy version of FormSG',
  [`${KEY}.suffix`]: '.',
}

const t = ((key: string, options?: { reasons?: string }): string => {
  if (key === `${KEY}.prefix`) return `Need ${options?.reasons ?? ''}? Use the `
  return EN[key] ?? key
}) as unknown as TFunction

describe('composeEscapeHatchCopy', () => {
  it('returns payments-only copy when no extra flags are set', () => {
    expect(composeEscapeHatchCopy(t)).toEqual({
      prefix: 'Need payments? Use the ',
      linkText: 'legacy version of FormSG',
      suffix: '.',
    })
  })

  it('mentions Myinfo Children fields when children flag is set', () => {
    expect(composeEscapeHatchCopy(t, { children: true }).prefix).toBe(
      'Need payments or Myinfo Children fields? Use the ',
    )
  })

  it('mentions webhooks v1 when createStorageModeForV1Webhook flag is set', () => {
    expect(
      composeEscapeHatchCopy(t, { createStorageModeForV1Webhook: true }).prefix,
    ).toBe('Need payments or webhooks v1? Use the ')
  })

  it('composes all reasons when both flags are set', () => {
    expect(
      composeEscapeHatchCopy(t, {
        children: true,
        createStorageModeForV1Webhook: true,
      }).prefix,
    ).toBe('Need payments, Myinfo Children fields, or webhooks v1? Use the ')
  })

  it('ignores unrelated falsy flags', () => {
    expect(
      composeEscapeHatchCopy(t, {
        children: false,
        createStorageModeForV1Webhook: false,
      }).prefix,
    ).toBe('Need payments? Use the ')
  })
})
