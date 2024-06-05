import isEmpty from 'lodash/isEmpty'
import validator from 'validator'

export const validateEmailDomains = (emailDomains: string[]): boolean => {
  return (
    isEmpty(emailDomains) ||
    (new Set(emailDomains).size === emailDomains.length &&
      emailDomains.every(
        (emailDomain) =>
          // We need to prepend "bob" to the email domain so that it can form an
          // email address and can be validated by validator.isEmail.
          emailDomain.startsWith('@') && validator.isEmail('bob' + emailDomain),
      ))
  )
}
