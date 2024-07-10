import { ApplicationError, ErrorCodes } from '../../modules/core/core.errors'

/**
 * Error connecting to captcha server
 */
export class CaptchaConnectionError extends ApplicationError {
  constructor(message = 'Error while connecting to Captcha server') {
    super(message, undefined, ErrorCodes.CAPTCHA_CONNECTION)
  }
}

/**
 * Wrong captcha response
 */
export class VerifyCaptchaError extends ApplicationError {
  constructor(message = 'Incorrect Captcha response') {
    super(message, undefined, ErrorCodes.CAPTCHA_VERIFY)
  }
}

/**
 * Missing captcha response
 */
export class MissingCaptchaError extends ApplicationError {
  constructor(message = 'Missing Captcha response') {
    super(message, undefined, ErrorCodes.CAPTCHA_MISSING)
  }
}
