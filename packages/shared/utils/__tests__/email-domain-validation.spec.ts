import {
  emailDomainMatchesAllowed,
  validateEmailDomains,
} from '../email-domain-validation'

describe('validateEmailDomains', () => {
  it('should return true for empty array', () => {
    expect(validateEmailDomains([])).toBe(true)
  })

  it('should return true for valid exact domains', () => {
    expect(validateEmailDomains(['@test.gov.sg'])).toBe(true)
    expect(validateEmailDomains(['@example.com', '@test.gov.sg'])).toBe(true)
  })

  it('should return false for domains without @', () => {
    expect(validateEmailDomains(['test.gov.sg'])).toBe(false)
  })

  it('should return false for duplicate domains', () => {
    expect(validateEmailDomains(['@test.gov.sg', '@test.gov.sg'])).toBe(false)
  })

  it('should return true for valid wildcard domains', () => {
    expect(validateEmailDomains(['@*.gov.sg'])).toBe(true)
    expect(validateEmailDomains(['@*.moe.gov.sg'])).toBe(true)
  })

  it('should return false for invalid wildcard domains', () => {
    expect(validateEmailDomains(['@*.'])).toBe(false)
    expect(validateEmailDomains(['@*'])).toBe(false)
  })

  it('should accept a mix of exact and wildcard domains', () => {
    expect(
      validateEmailDomains(['@test.gov.sg', '@*.moe.gov.sg']),
    ).toBe(true)
  })
})

describe('emailDomainMatchesAllowed', () => {
  describe('exact matching', () => {
    it('should match identical domains', () => {
      expect(emailDomainMatchesAllowed('@test.gov.sg', '@test.gov.sg')).toBe(
        true,
      )
    })

    it('should match case-insensitively', () => {
      expect(emailDomainMatchesAllowed('@TeSt.GoV.Sg', '@test.gov.sg')).toBe(
        true,
      )
    })

    it('should not match different domains', () => {
      expect(
        emailDomainMatchesAllowed('@other.gov.sg', '@test.gov.sg'),
      ).toBe(false)
    })

    it('should not match subdomains against an exact domain', () => {
      expect(
        emailDomainMatchesAllowed('@mail.test.gov.sg', '@test.gov.sg'),
      ).toBe(false)
    })
  })

  describe('wildcard matching', () => {
    it('should match a single subdomain level', () => {
      expect(
        emailDomainMatchesAllowed('@mail.moe.gov.sg', '@*.moe.gov.sg'),
      ).toBe(true)
    })

    it('should match multiple subdomain levels', () => {
      expect(
        emailDomainMatchesAllowed(
          '@dept.mail.moe.gov.sg',
          '@*.moe.gov.sg',
        ),
      ).toBe(true)
    })

    it('should not match the base domain itself', () => {
      expect(
        emailDomainMatchesAllowed('@moe.gov.sg', '@*.moe.gov.sg'),
      ).toBe(false)
    })

    it('should match case-insensitively', () => {
      expect(
        emailDomainMatchesAllowed('@Mail.MOE.Gov.Sg', '@*.moe.gov.sg'),
      ).toBe(true)
    })

    it('should not match unrelated domains with same suffix', () => {
      expect(
        emailDomainMatchesAllowed('@notmoe.gov.sg', '@*.moe.gov.sg'),
      ).toBe(false)
    })
  })
})
