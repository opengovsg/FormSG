import validator from 'validator'

/**
 * Checks that string is a valid URL over HTTPS.
 * @param url
 */
export const isValidHttpsUrl = (url: string): boolean => {
  // TODO(#1788): Remove redundant type assertions once frontend is fully in Typescript.
  if (typeof url !== 'string') {
    return false
  }
  return validator.isURL(url, {
    protocols: ['https'],
    require_protocol: true,
  })
}

/**
 * Checks that string is a valid HTTP or HTTPS URL.
 * @param url the url to check
 * @returns true if valid, false otherwise
 */
export const isValidUrl = (url: string): boolean => {
  // TODO(#1788): Remove redundant type assertions once frontend is fully in Typescript.
  if (typeof url !== 'string') {
    return false
  }
  return validator.isURL(url, {
    protocols: ['https', 'http'],
  })
}
