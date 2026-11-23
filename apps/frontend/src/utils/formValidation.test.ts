import { renderHook } from '@testing-library/react'

import { useAdminEmailListValidationRules } from './formValidation'

const renderRules = (
  options?: Parameters<typeof useAdminEmailListValidationRules>[0],
) =>
  renderHook(() => useAdminEmailListValidationRules(options)).result.current
    .validate

describe('useAdminEmailListValidationRules', () => {
  it('needs at least one email by default', () => {
    expect(renderRules().required([])).toBe(
      'You must at least enter one email to receive responses',
    )
    expect(renderRules({ isRequired: false }).required([])).toBe(true)
  })

  it('rejects a list with an invalid email', () => {
    const { valid } = renderRules()

    expect(valid(['jane@agency.gov.sg'])).toBe(true)
    expect(valid(['jane@agency.gov.sg', 'bob@agency'])).not.toBe(true)
  })

  it('rejects a list with the same email twice', () => {
    const { duplicate } = renderRules()

    expect(duplicate(['jane@agency.gov.sg', 'jane@agency.gov.sg'])).not.toBe(
      true,
    )
  })

  it('shows the limit in the error message', () => {
    const { maxLength } = renderRules({ maxEmails: 2 })

    expect(maxLength(['a@x.sg', 'b@x.sg'])).toBe(true)
    expect(maxLength(['a@x.sg', 'b@x.sg', 'c@x.sg'])).toBe(
      'Please limit number of emails to 2',
    )
  })

  it('has no limit unless one is given', () => {
    const emails = Array.from({ length: 100 }, (_, i) => `${i}@agency.gov.sg`)

    expect(renderRules().maxLength(emails)).toBe(true)
  })
})
