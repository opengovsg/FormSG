import { ApplicationError } from '../../modules/core/core.errors'

export class SmsSendError extends ApplicationError {
  constructor(
    message = 'Error sending OTP. Please try again later and if the problem persists, contact us.',
    meta?: unknown,
  ) {
    super(message, meta)
  }
}

export class InvalidNumberError extends ApplicationError {
  constructor(message = 'Please enter a valid phone number') {
    super(message)
  }
}
