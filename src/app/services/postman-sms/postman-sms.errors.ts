import { ApplicationError, ErrorCodes } from '../../modules/core/core.errors'

export class SmsSendError extends ApplicationError {
  constructor(
    message = 'Error sending OTP. Please try again later and if the problem persists, contact us.',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.POSTMAN_SMS_SEND)
  }
}

export class InvalidNumberError extends ApplicationError {
  constructor(message = 'Please enter a valid phone number') {
    super(message, undefined, ErrorCodes.POSTMAN_INVALID_NUMBER)
  }
}
