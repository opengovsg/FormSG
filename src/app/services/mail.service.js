const validator = require('validator')
const HttpStatus = require('http-status-codes')
const _ = require('lodash')

const mailLogger = require('../../config/logger').createLoggerWithLabel('mail')
const { HASH_EXPIRE_AFTER_SECONDS } = require('../../shared/util/verification')
const config = require('../../config/config')
const { EMAIL_HEADERS, EMAIL_TYPES } = require('../utils/constants')
const {
  transporter,
  retry: { retryDuration, maxRetryCount, maxRetryDuration },
  mailer,
} = config.mail

/**
 * Exponential backoff with full jitter
 * @param {Number} retryCount - Number of email retries left
 * @returns {Number} The duration to await, in milliseconds
 */
function calcEmailRetryDuration(retryCount) {
  const attempt = maxRetryCount - retryCount
  const newDuration = retryDuration * Math.pow(2, attempt)
  const jitter = newDuration * (Math.random() * 2 - 1)
  return Math.min(maxRetryDuration, newDuration + jitter)
}
/**
 * Sends email to SES / Direct transport to send out
 * @param  {Object} email - Email object
 * @param  {Object} email.mail - Email
 * @param  {String} email.mail.to - Email address of recipient
 * @param  {String} email.mail.from - Email address of sender
 * @param  {String} email.mail.subject - Email subject
 * @param  {String} email.mail.html - HTML of email
 * @param  {Object} email.options.retryCount - Number of retries left - must be greater than zero.
 */
async function sendNodeMail(email) {
  // In case of missing mail info
  if (!email.mail || !email.mail.to) {
    return Promise.reject('Mail undefined error')
  }

  const { options } = email
  const retryEmail = options && options.retryCount ? _.cloneDeep(email) : null
  const emailLogString = `"Id: ${(options || {}).mailId} Email\t from:${
    email.mail.from
  }\t subject:${email.mail.subject}\t formId: ${(options || {}).formId}"`
  mailLogger.info(emailLogString)
  mailLogger.profile(emailLogString)
  try {
    const response = await transporter.sendMail(email.mail)
    mailLogger.info(`mailSuccess:\t${emailLogString}`)
    return response
  } catch (err) {
    if (
      err.responseCode >= HttpStatus.BAD_REQUEST &&
      err.responseCode < HttpStatus.INTERNAL_SERVER_ERROR
    ) {
      // Retry for any emails with retryCount > 0, and 4xx errors
      if (
        retryEmail !== null &&
        maxRetryCount >= retryEmail.options.retryCount &&
        retryEmail.options.retryCount > 0
      ) {
        const duration = calcEmailRetryDuration(retryEmail.options.retryCount)
        mailLogger.error(
          `mailError ${err.responseCode} retryCount ${retryEmail.options.retryCount} duration ${duration}ms:\t${emailLogString}`,
        )
        retryEmail.options.retryCount--
        return retryNodeMail(retryEmail, duration)
      } else {
        // No retry specified or ran out of retries,
        const retryCount = _.get(retryEmail, 'options.retryCount', undefined)
        mailLogger.error(
          `mailError ${err.responseCode} retryCount ${retryCount}:\t${emailLogString}`,
        )
        return Promise.reject(err)
      }
    } else if (err && err.responseCode) {
      // Pass any other errors to the callback
      mailLogger.error(`mailError ${err.responseCode}:\t${emailLogString}`)
      return Promise.reject(err)
    } else {
      mailLogger.error(`mailError "${err}":\t${emailLogString}`)
      return Promise.reject(err)
    }
  }
}

/**
 * Attempts an email retry after a given duration.
 * @param {Object} retryEmail Info on email to retry. Equivalent to first argument of sendNodeMail.
 * @param {number} duration Duration to wait before attempting retry.
 * @return {Promise<Object>} Response info from email.
 */
const retryNodeMail = (retryEmail, duration) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      sendNodeMail(retryEmail)
        .then((response) => resolve(response))
        .catch((err) => reject(err))
    }, duration)
  })
}

/**
 * Sends an otp to a valid email
 * @param {string} recipient
 * @param {string} otp
 * @throws {Error} error if mail fails, to be handled by verification service
 */
const sendVerificationOtp = async (recipient, otp) => {
  if (!validator.isEmail(recipient))
    throw new Error(`${recipient} is not a valid email`)
  const mailOptions = {
    to: recipient,
    from: mailer.from,
    subject: `Your OTP for submitting a form on ${config.app.title}`,
    html: `
        <p>You are currently submitting a form on ${config.app.title}.</p>
        <p> Your OTP is <b>${otp}</b>. 
        It will expire in ${Math.floor(
          HASH_EXPIRE_AFTER_SECONDS / 60,
        )} minutes. 
        Please use this to verify your submission.</p>
        <p>If your OTP does not work, please request for a new OTP.</p>
        `,
    headers: {
      [EMAIL_HEADERS.emailType]: EMAIL_TYPES.verificationOtp,
    },
  }
  // Error gets caught in getNewOtp
  await sendNodeMail({
    mail: mailOptions,
    options: { mailId: 'verify' },
  })
}

module.exports = {
  sendVerificationOtp,
  sendNodeMail,
}
