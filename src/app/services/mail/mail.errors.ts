import { ApplicationError, ErrorCodes } from '../../modules/core/core.errors'

export class MailSendError extends ApplicationError {
  constructor(
    message = 'Error sending OTP. Please try again later and if the problem persists, contact us.',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.MailSend)
  }
}

export class MailGenerationError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.MailGeneration)
  }
}
