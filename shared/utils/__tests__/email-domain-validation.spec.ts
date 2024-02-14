import { validateEmailDomains } from '../email-domain-validation'

describe('validateEmailDomains', () => {
  it('should allow domains with a single asterisk', () => {
    expect(validateEmailDomains(['@*.tld'])).toBe(true)
    expect(validateEmailDomains(['@*.gov.sg'])).toBe(true)
  })

  it('should allow domains without asterisks', () => {
    expect(validateEmailDomains(['@domain.tld'])).toBe(true)
    expect(validateEmailDomains(['@sub.domain.sg'])).toBe(true)
  })

  it('should not allow domains with multiple asterisks', () => {
    expect(validateEmailDomains(['@*.*.tld'])).toBe(false)
    expect(validateEmailDomains(['@*.sub.*.sg'])).toBe(false)
  })

  it('should not allow domains with asterisks not at the start', () => {
    expect(validateEmailDomains(['@domain.*.tld'])).toBe(false)
    expect(validateEmailDomains(['@sub.*domain.sg'])).toBe(false)
  })

  it('should not allow invalid domains', () => {
    expect(validateEmailDomains(['@*.'])).toBe(false)
    expect(validateEmailDomains(['@*..tld'])).toBe(false)
    expect(validateEmailDomains(['@.tld'])).toBe(false)
    expect(validateEmailDomains(['tld'])).toBe(false)
    expect(validateEmailDomains(['@domain.tld*'])).toBe(false)
  })
})
