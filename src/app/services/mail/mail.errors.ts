import { ApplicationError } from '../../modules/core/core.errors'

export class MailSendError extends ApplicationError {
  constructor(
    message = 'Error sending OTP. Please try again later and if the problem persists, contact us.',
  ) {
    super(message)
  }
}

export class MailGenerationError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}
