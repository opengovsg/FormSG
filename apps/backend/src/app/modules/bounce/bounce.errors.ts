import {
  InvalidNumberError,
  SmsSendError,
} from '../../services/postman-sms/postman-sms.errors'
import { ApplicationError, ErrorCodes } from '../core/core.errors'

/**
 * Unexpected shape of request body.
 */
export class InvalidNotificationError extends ApplicationError {
  constructor(message = 'Notification from AWS could not be validated') {
    super(message, undefined, ErrorCodes.BOUNCE_INVALID_NOTIFCATION)
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
    super(message, undefined, ErrorCodes.BOUNCE_SEND_BOUNCE_SMS_NOTIFICATION)
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
    super(message, undefined, ErrorCodes.BOUNCE_MISSING_EMAIL_HEADERS)
  }
}

/**
 * Error while parsing notification
 */
export class ParseNotificationError extends ApplicationError {
  constructor(message = 'Could not parse SNS notification') {
    super(message, undefined, ErrorCodes.BOUNCE_PARSE_NOTIFICATION)
  }
}
