import { ApplicationError } from '../../modules/core/core.errors'

/**
 * Error connecting to captcha server
 */
export class CaptchaConnectionError extends ApplicationError {
  constructor(message = 'Error while connecting to Captcha server') {
    super(message)
  }
}

/**
 * Wrong captcha response
 */
export class VerifyCaptchaError extends ApplicationError {
  constructor(message = 'Incorrect captcha response') {
    super(message)
  }
}
