const axios = require('axios')
const crypto = require('crypto')
const { get, isEmpty } = require('lodash')
const { EMAIL_HEADERS } = require('../constants/mail')

// Note that these need to be ordered in order to generate
// the correct string to sign
const snsKeys = [
  { key: 'Message', toSign: true },
  { key: 'MessageId', toSign: true },
  { key: 'Timestamp', toSign: true },
  { key: 'TopicArn', toSign: true },
  { key: 'Type', toSign: true },
  { key: 'Signature', toSign: false },
  { key: 'SigningCertURL', toSign: false },
  { key: 'SignatureVersion', toSign: false },
]

const EMAIL_LOWERCASE_HEADER_TO_KEY = (() => {
  // EMAIL_HEADERS with keys and values swapped and the new keys (e.g. X-Formsg-Form-ID)
  // changed to lowercase (x-formsg-form-id).
  // NOTE: ALWAYS DO CASE-INSENSITIVE CHECKS FOR THE HEADERS!
  const lowercasedHeadersToKey = {}
  for (const [key, value] of Object.entries(EMAIL_HEADERS)) {
    lowercasedHeadersToKey[value.toLowerCase()] = key
  }
  return lowercasedHeadersToKey
})()

// Hostname for AWS URLs
const AWS_HOSTNAME = '.amazonaws.com'

/**
 * Checks that a request body has all the required keys for a message from SNS.
 * @param {Object} body body from Express request object
 */
const hasRequiredKeys = (body) => {
  return snsKeys.every((keyObj) => body[keyObj.key])
}

/**
 * Validates that a URL points to a certificate belonging to AWS.
 * @param {String} url URL to check
 */
const isValidCertUrl = (certUrl) => {
  const parsed = new URL(certUrl)
  return (
    parsed.protocol === 'https:' &&
    parsed.pathname.endsWith('.pem') &&
    parsed.hostname.endsWith(AWS_HOSTNAME)
  )
}

/**
 * Returns an ordered list of keys to include in SNS signing string.
 */
const getSnsKeysToSign = () => {
  return snsKeys.filter((keyObj) => keyObj.toSign).map((keyObj) => keyObj.key)
}

/**
 * Generates the string to sign.
 * @param {Object} body body from Express request object
 */
const getSnsBasestring = (body) => {
  return getSnsKeysToSign().reduce((result, key) => {
    return result + key + '\n' + body[key] + '\n'
  }, '')
}

/**
 * Verify signature for SNS request
 * @param {Object} body body from Express request object
 */
const isValidSnsSignature = async (body) => {
  const { data: cert } = await axios.get(body.SigningCertURL)
  const verifier = crypto.createVerify('RSA-SHA1')
  verifier.update(getSnsBasestring(body), 'utf-8')
  return verifier.verify(cert, body.Signature, 'base64')
}

/**
 * Verifies if a request object is correctly signed by Amazon SNS.
 * @param {Object} body Body of Express request object
 */
const isValidSnsRequest = async (body) => {
  const isValid =
    !isEmpty(body) &&
    hasRequiredKeys(body) &&
    body.SignatureVersion === '1' && // We only check for SHA1-RSA signatures
    isValidCertUrl(body.SigningCertURL) &&
    (await isValidSnsSignature(body))
  return isValid
}

/**
 * Parses the POST body of an SNS notification for SES
 * emails. Returns an object with the important keys.
 * Structure of notification can be found at
 * https://docs.aws.amazon.com/ses/latest/DeveloperGuide/notification-contents.html
 * @param {Object} body POST body of SNS request
 * @returns {Object} Object containing keys parsed from POST body or empty object if parsing fails
 */
const parseSns = (body) => {
  try {
    // Extract relevant values
    const content = JSON.parse(body.Message)
    const parsed = {}
    parsed.to = get(content, 'mail.commonHeaders.to')
    parsed.subject = get(content, 'mail.commonHeaders.subject')
    parsed.notificationType = content.notificationType
    if (parsed.notificationType === 'Bounce') {
      parsed.bounceType = get(content, 'bounce.bounceType')
      parsed.bouncedEmails = get(content, 'bounce.bouncedRecipients').map(
        (info) => info.emailAddress,
      )
    }
    // Custom headers which we send with all emails, such as form ID, submission ID
    // and email type (admin response, email confirmation OTP etc).
    // e.g. if header.name === 'X-Formsg-Form-ID', we want to set
    // parsed.formId = header.value
    const headers = get(content, 'mail.headers')
    headers.forEach((header) => {
      const customHeaderKey =
        EMAIL_LOWERCASE_HEADER_TO_KEY[header.name.toLowerCase()]
      if (customHeaderKey) {
        parsed[customHeaderKey] = header.value
      }
    })
    return parsed
  } catch (err) {
    // Could not parse
    return {}
  }
}

module.exports = {
  getSnsBasestring,
  isValidSnsRequest,
  parseSns,
}
