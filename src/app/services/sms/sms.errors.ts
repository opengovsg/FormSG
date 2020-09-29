import { ApplicationError } from 'src/app/modules/core/core.errors'

export class SmsSendError extends ApplicationError {
  constructor(
    message = 'Error sending OTP. Please try again later and if the problem persists, contact us.',
  ) {
    super(message)
  }
}
