import isEmpty from 'lodash/isEmpty'
import validator from 'validator'

export const validateEmailDomains = (emailDomains: string[]): boolean => {
  const isValidAsteriskUsage = (domain: string) => {
    const asteriskOccurrences = (domain.match(/\*/g) || []).length
    return (
      asteriskOccurrences === 0 ||
      (asteriskOccurrences === 1 && domain.indexOf('*') === 1)
    )
  }

  return (
    isEmpty(emailDomains) ||
    (emailDomains.every(isValidAsteriskUsage) &&
      new Set(emailDomains).size === emailDomains.length &&
      emailDomains.every(
        (emailDomain) =>
          // We need to prepend "bob" to the email domain so that it can form an
          // email address and can be validated by validator.isEmail.
          emailDomain.startsWith('@') &&
          validator.isEmail('bob' + emailDomain.replace(/\*/g, 'example')),
      ))
  )
}
