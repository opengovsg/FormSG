import HttpStatus from 'http-status-codes'
import _ from 'lodash'
import Mail from 'nodemailer/lib/mailer'
import validator from 'validator'
import { Logger } from 'winston'

import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import { HASH_EXPIRE_AFTER_SECONDS } from '../../shared/util/verification'
import { EMAIL_HEADERS, EMAIL_TYPES } from '../utils/constants'

const logger = createLoggerWithLabel('mail')

type NodeMailParams = {
  mail: {
    to: string
    from: string
    subject: string
    html: string
    headers?: {
      [x: string]: string
    }
  }
  options: {
    mailId?: string
    formId?: string
    retryCount?: number
  }
}

type MailServiceParams = {
  appName: string
  transporter: Mail
  senderEmail: string
  retryDuration: number
  maxRetryCount: number
  maxRetryDuration: number
  logger: Logger
}

export class MailService {
  #appName: string
  #transporter: Mail
  #senderEmail: string
  #retryDuration: number
  #maxRetryCount: number
  #maxRetryDuration: number
  #logger: Logger

  constructor({
    appName,
    transporter,
    retryDuration,
    senderEmail,
    maxRetryCount,
    maxRetryDuration,
    logger,
  }: MailServiceParams) {
    this.#appName = appName
    this.#senderEmail = senderEmail
    this.#transporter = transporter
    this.#retryDuration = retryDuration
    this.#maxRetryCount = maxRetryCount
    this.#maxRetryDuration = maxRetryDuration
    this.#logger = logger
  }

  /**
   * Exponential backoff with full jitter
   * @param retryCount the number of email retries left
   * @returns The duration to await, in milliseconds
   */
  #calcEmailRetryDuration = (retryCount: number) => {
    const attempt = this.#maxRetryCount - retryCount
    const newDuration = this.#retryDuration * Math.pow(2, attempt)
    const jitter = newDuration * (Math.random() * 2 - 1)
    return Math.min(this.#maxRetryDuration, newDuration + jitter)
  }

  /**
   * Sends email to SES / Direct transport to send out
   * @param params Email object
   * @param params.mail Email to send
   * @param params.mail.to Email address of recipient
   * @param params.mail.from Email address of sender
   * @param params.mail.subject Email subject
   * @param params.mail.html HTML of email
   * @param params.options.retryCount Number of retries left - must be greater than zero.
   */
  sendNodeMail = async (params: NodeMailParams) => {
    // In case of missing mail info
    if (!params.mail || !params.mail.to) {
      return Promise.reject('Mail undefined error')
    }

    const options = params.options || {}

    const retryEmail =
      options && options.retryCount ? _.cloneDeep(params) : null
    const emailLogString = `"Id: ${options.mailId} Email\t from:${params.mail.from}\t subject:${params.mail.subject}\t formId: ${options.formId}"`

    this.#logger.info(emailLogString)
    this.#logger.profile(emailLogString)

    try {
      const response = await this.#transporter.sendMail(params.mail)
      this.#logger.info(`mailSuccess:\t${emailLogString}`)
      return response
    } catch (err) {
      if (
        err.responseCode >= HttpStatus.BAD_REQUEST &&
        err.responseCode < HttpStatus.INTERNAL_SERVER_ERROR
      ) {
        // Retry for any emails with retryCount > 0, and 4xx errors
        if (
          retryEmail !== null &&
          this.#maxRetryCount >= retryEmail.options.retryCount &&
          retryEmail.options.retryCount > 0
        ) {
          const duration = this.#calcEmailRetryDuration(
            retryEmail.options.retryCount,
          )
          this.#logger.error(
            `mailError ${err.responseCode} retryCount ${retryEmail.options.retryCount} duration ${duration}ms:\t${emailLogString}`,
          )
          retryEmail.options.retryCount--
          return this.#retryNodeMail(retryEmail, duration)
        } else {
          // No retry specified or ran out of retries,
          const retryCount = _.get(retryEmail, 'options.retryCount', undefined)
          this.#logger.error(
            `mailError ${err.responseCode} retryCount ${retryCount}:\t${emailLogString}`,
          )
          return Promise.reject(err)
        }
      } else if (err && err.responseCode) {
        // Not 4xx error, pass any other errors to the callback
        this.#logger.error(`mailError ${err.responseCode}:\t${emailLogString}`)
        return Promise.reject(err)
      } else {
        this.#logger.error(`mailError "${err}":\t${emailLogString}`)
        return Promise.reject(err)
      }
    }
  }

  /**
   * Attempts an email retry after a given duration.
   * @param retryEmail Info on email to retry. Equivalent to first argument of sendNodeMail
   * @param duration Duration to wait before attempting retry
   * @return Response info from email
   */
  #retryNodeMail = (retryEmail: NodeMailParams, duration: number) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.sendNodeMail(retryEmail)
          .then((response) => resolve(response))
          .catch((err) => reject(err))
      }, duration)
    })
  }

  /**
   * Sends an otp to a valid email
   * @param recipient the recipient email address
   * @param otp the otp to send
   * @throws error if mail fails, to be handled by verification service
   */
  sendVerificationOtp = async (recipient: string, otp: string) => {
    if (!validator.isEmail(recipient)) {
      throw new Error(`${recipient} is not a valid email`)
    }

    const minutesToExpiry = Math.floor(HASH_EXPIRE_AFTER_SECONDS / 60)

    const mailOptions: NodeMailParams['mail'] = {
      to: recipient,
      from: this.#senderEmail,
      subject: `Your OTP for submitting a form on ${this.#appName}`,
      html: `
        <p>You are currently submitting a form on ${this.#appName}.</p>
        <p> Your OTP is <b>${otp}</b>. 
        It will expire in ${minutesToExpiry} minutes. 
        Please use this to verify your submission.</p>
        <p>If your OTP does not work, please request for a new OTP.</p>
        `,
      headers: {
        [EMAIL_HEADERS.emailType]: EMAIL_TYPES.verificationOtp,
      },
    }
    // Error gets caught in getNewOtp
    await this.sendNodeMail({
      mail: mailOptions,
      options: { mailId: 'verify' },
    })
  }
}

const {
  transporter,
  retry: { retryDuration, maxRetryCount, maxRetryDuration },
  mailer,
} = config.mail

export default new MailService({
  appName: config.app.title,
  logger,
  maxRetryCount,
  maxRetryDuration,
  retryDuration,
  transporter,
  senderEmail: mailer.from,
})
