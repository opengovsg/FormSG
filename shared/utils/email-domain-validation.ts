import isEmpty from 'lodash/isEmpty'
import validator from 'validator'

export const validateEmailDomains = (emailDomains: string[]): boolean => {
  const isValidAsteriskUsage = (domain: string) => {
    const parts = domain.split('*');
    return parts.length <= 2 && !parts.some(part => part.includes('.'));
  };

  return (
    emailDomains.every(isValidAsteriskUsage) &&
    isEmpty(emailDomains) ||
    (new Set(emailDomains).size === emailDomains.length &&
      emailDomains.every(
        (emailDomain) => {
          // We need to prepend "bob" to the email domain so that it can form an
          // email address and can be validated by validator.isEmail.

          // For wildcards, just replacing them with example to form a domain
          const domainToCheck = emailDomain.startsWith('@*.')
            ? 'bob' + emailDomain.replace('*', 'example')
            : 'bob' + emailDomain;

          return validator.isEmail(domainToCheck);
        }
      ))
  )
}
