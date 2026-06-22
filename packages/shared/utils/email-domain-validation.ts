import isEmpty from 'lodash/isEmpty'
import validator from 'validator'

/**
 * Checks whether a single allowed-domain entry is syntactically valid.
 * Accepts exact domains (`@example.gov.sg`) and wildcard domains
 * (`@*.example.gov.sg`).
 */
const isValidDomainEntry = (emailDomain: string): boolean => {
  if (!emailDomain.startsWith('@')) return false

  // Wildcard pattern: @*.something.tld
  if (emailDomain.startsWith('@*.')) {
    const baseDomain = emailDomain.slice(2) // ".something.tld"
    // Validate by forming a synthetic email with the base domain.
    return validator.isEmail('bob@sub' + baseDomain)
  }

  // Exact domain – existing behaviour.
  return validator.isEmail('bob' + emailDomain)
}

export const validateEmailDomains = (emailDomains: string[]): boolean => {
  return (
    isEmpty(emailDomains) ||
    (new Set(emailDomains).size === emailDomains.length &&
      emailDomains.every(isValidDomainEntry))
  )
}

/**
 * Returns true when `emailDomain` (e.g. `@mail.moe.gov.sg`) matches the
 * given `allowedDomain` pattern.
 *
 * - Exact pattern  `@moe.gov.sg`      → matches only `@moe.gov.sg`.
 * - Wildcard       `@*.moe.gov.sg`    → matches any `@<sub>.moe.gov.sg`
 *   (one or more subdomain levels).
 *
 * Both sides are compared lower-cased.
 */
export const emailDomainMatchesAllowed = (
  emailDomain: string,
  allowedDomain: string,
): boolean => {
  const lowerEmail = emailDomain.toLowerCase()
  const lowerAllowed = allowedDomain.toLowerCase()

  if (!lowerAllowed.startsWith('@*.')) {
    return lowerEmail === lowerAllowed
  }

  // +1 accounts for the leading '@' that is NOT part of baseSuffix.
  const baseSuffix = lowerAllowed.slice(2) // ".base.tld"
  return (
    lowerEmail.endsWith(baseSuffix) && lowerEmail.length > baseSuffix.length + 1
  )
}
