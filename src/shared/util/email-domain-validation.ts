import { isEmpty } from 'lodash'
import validator from 'validator'

export const validateEmailDomains = (emailDomains: string[]): boolean => {
  // We need to prepend "bob" to the email domain so that it can form an email address and can be
  // validated by validator.isEmail.
  return (
    isEmpty(emailDomains) ||
    (new Set(emailDomains).size === emailDomains.length &&
      emailDomains.every((emailDomain) =>
        validator.isEmail('bob' + emailDomain),
      ))
  )
}
