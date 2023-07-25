import validator from 'validator'

/**
 * Checks that string is a valid URL over HTTPS.
 * @param url
 */
export const isValidHttpsUrl = (url: string): boolean =>
  validator.isURL(url, {
    protocols: ['https'],
    require_protocol: true,
  })
