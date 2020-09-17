import { ApplicationError } from '../core/core.errors'

export class MailSendError extends ApplicationError {
  constructor(
    message = 'Error sending OTP. Please try again later and if the problem persists, contact us.',
  ) {
    super(message)
  }
}
