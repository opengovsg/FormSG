import { isEmpty } from 'lodash'
import validator from 'validator'

export const validateEmailDomains = (emailDomains: string[]): boolean => {
  return (
    isEmpty(emailDomains) ||
    (new Set(emailDomains).size === emailDomains.length &&
      emailDomains.every((emailDomain) =>
        validator.isEmail('bob' + emailDomain),
      ))
  )
}
