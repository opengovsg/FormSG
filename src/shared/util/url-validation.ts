import validator from 'validator'

/**
 * Checks that string is a valid URL over HTTPS.
 * @param url
 */
export const isValidHttpsUrl = (url: string): boolean => {
  if (typeof url !== 'string') {
    return false
  }
  return validator.isURL(url, {
    protocols: ['https'],
    require_protocol: true,
  })
}
