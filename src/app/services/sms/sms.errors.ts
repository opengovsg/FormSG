import { ApplicationError } from '../../modules/core/core.errors'

export class SmsSendError extends ApplicationError {
  code?: number
  sendStatus: unknown

  constructor(
    message = 'Error sending OTP. Please try again later and if the problem persists, contact us.',
    code?: number,
    sendStatus?: unknown,
  ) {
    super(message)
    this.code = code
    this.sendStatus = sendStatus
  }
}
