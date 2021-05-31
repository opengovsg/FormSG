import { ApplicationError } from '../../modules/core/core.errors'

export class MailSendError extends ApplicationError {
  constructor(
    message = 'Error sending OTP. Please try again later and if the problem persists, contact us.',
    meta?: unknown,
  ) {
    super(message, meta)
  }
}

export class MailGenerationError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}

export class InvalidMailAddressError extends ApplicationError {
  constructor(
    message = 'An error occured while trying to parse a string as an email address',
  ) {
    super(message)
  }
}
