import { InvalidNumberError, SmsSendError } from '../../services/sms/sms.errors'
import { ApplicationError } from '../core/core.errors'

/**
 * Error while retrieving the public key from the certificate URL provided
 * in the SNS notification body.
 */
export class RetrieveAwsCertError extends ApplicationError {
  constructor(message = 'Error while retrieving AWS signing public key') {
    super(message)
  }
}

/**
 * Unexpected shape of request body.
 */
export class InvalidNotificationError extends ApplicationError {
  constructor(message = 'Notification from AWS could not be validated') {
    super(message)
  }
}

/**
 * Error while sending bounce-related notification to form admins via SMS.
 */
export class SendBounceSmsNotificationError extends ApplicationError {
  meta: {
    contact: string
    originalError: SmsSendError | InvalidNumberError
  }

  constructor(
    originalError: SmsSendError | InvalidNumberError,
    contact: string,
    message = 'Error while sending bounce notification via SMS',
  ) {
    super(message)
    this.meta = {
      contact,
      originalError,
    }
  }
}

/**
 * Email headers are missing the custom headers containing form and submission IDs.
 */
export class MissingEmailHeadersError extends ApplicationError {
  constructor(
    message = 'Email is missing custom header containing form or submission ID',
  ) {
    super(message)
  }
}

/**
 * Error while parsing notification
 */
export class ParseNotificationError extends ApplicationError {
  constructor(message = 'Could not parse SNS notification') {
    super(message)
  }
}
