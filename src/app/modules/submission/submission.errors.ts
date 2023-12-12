import { FormResponseMode } from '../../../../shared/types'
import { ApplicationError } from '../core/core.errors'

/**
 * A custom error class thrown by the submission controllers
 * when some form fields are missing from the submission
 */
export class ConflictError extends ApplicationError {
  constructor(message: string, meta?: unknown) {
    super(message, meta)
  }
}

export class SubmissionNotFoundError extends ApplicationError {
  constructor(message = 'Submission not found for given ID') {
    super(message)
  }
}

export class PendingSubmissionNotFoundError extends ApplicationError {
  constructor(message = 'Pending submission not found for given ID') {
    super(message)
  }
}

export class InvalidSubmissionTypeError extends ApplicationError {
  constructor(message = 'Unexpected submission type encountered.') {
    super(message)
  }
}

/**
 * A custom error class returned when given submission has invalid encryption encoding
 */
export class InvalidEncodingError extends ApplicationError {
  constructor(message = 'Error with encoding.') {
    super(message)
  }
}

/**
 * A custom error class returned when given submission has response that cannot be processed
 */
export class ProcessingError extends ApplicationError {
  constructor(message = 'Error processing response.') {
    super(message)
  }
}

/**
 * A custom error class returned when given submission has field validation failure
 */
export class ValidateFieldError extends ApplicationError {
  constructor(message = 'Error validating field.', status = 400) {
    super(message, status)
  }
}

/**
 * Error while sending confirmation email to recipients.
 */
export class SendEmailConfirmationError extends ApplicationError {
  constructor(message = 'Error while sending confirmation emails') {
    super(message)
  }
}

/**
 * Attempt to submit form to wrong endpoint
 */
export class ResponseModeError extends ApplicationError {
  constructor(
    formResponseMode: FormResponseMode | FormResponseMode[],
    attemptedResponseMode: FormResponseMode,
  ) {
    super(
      `Attempted to submit ${formResponseMode} form to ${attemptedResponseMode} endpoint`,
    )
  }
}

/**
 * Attachment greater than size limit
 */
export class AttachmentTooLargeError extends ApplicationError {
  constructor(message = 'Attachment size limit exceeded') {
    super(message)
  }
}

/**
 * Generic error for errors thrown while receiving multipart form data
 */
export class InvalidFileExtensionError extends ApplicationError {
  constructor(message = 'Invalid file extension found in attachment') {
    super(message)
  }
}

export class SubmissionFailedError extends ApplicationError {
  constructor(
    message = 'The form submission could not be processed. Please try again.',
  ) {
    super(message)
  }
}

export class InvalidFieldIdError extends ApplicationError {
  constructor(
    message = 'Invalid field id. Field id should be a valid MongoDB ObjectId.',
  ) {
    super(message)
  }
}

export class AttachmentSizeLimitExceededError extends ApplicationError {
  constructor(
    message = `Total attachment size exceeds maximum file size limit. Please reduce your total attachment size and try again.`,
  ) {
    super(message)
  }
}

export class FeatureDisabledError extends ApplicationError {
  constructor(message = 'This feature is disabled.') {
    super(message)
  }
}

export class InvalidFileKeyError extends ApplicationError {
  constructor(message = 'Invalid file key. File keys should be valid UUIDs.') {
    super(message)
  }
}

export class VirusScanFailedError extends ApplicationError {
  constructor(message = 'Virus scan failed. Please try again.') {
    super(message)
  }
}

export class JsonParseFailedError extends ApplicationError {
  constructor(message = 'JSON parsing failed. Please try again.') {
    super(message)
  }
}

export class DownloadCleanFileFailedError extends ApplicationError {
  constructor(
    message = 'Attempt to download clean file failed. Please try again.',
  ) {
    super(message)
  }
}

export class ParseVirusScannerLambdaPayloadError extends ApplicationError {
  constructor(message = 'Unexpected payload from virus scanning lambda.') {
    super(message)
  }
}

export class MaliciousFileDetectedError extends ApplicationError {
  constructor(filename?: string) {
    super(
      `Your ${
        filename ? `file "${filename}"` : 'attachments(s)'
      } has failed our virus scan. Try to create and upload it again.`,
    )
  }
}
