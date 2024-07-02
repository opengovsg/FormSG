import { FormResponseMode } from '../../../../shared/types'
import { ApplicationError, ErrorCodes } from '../core/core.errors'

/**
 * A custom error class thrown by the submission controllers
 * when some form fields are missing from the submission
 */
export class ConflictError extends ApplicationError {
  constructor(message: string, meta?: unknown) {
    super(message, meta, ErrorCodes.SubmissionConflict)
  }
}

export class SubmissionNotFoundError extends ApplicationError {
  constructor(message = 'Submission not found for given ID') {
    super(message, undefined, ErrorCodes.SubmissionNotFound)
  }
}

export class PendingSubmissionNotFoundError extends ApplicationError {
  constructor(message = 'Pending submission not found for given ID') {
    super(message, undefined, ErrorCodes.PendingSubmissionNotFound)
  }
}

export class InvalidSubmissionTypeError extends ApplicationError {
  constructor(message = 'Unexpected submission type encountered.') {
    super(message, undefined, ErrorCodes.InvalidSubmissionType)
  }
}

/**
 * A custom error class returned when given submission has invalid encryption encoding
 */
export class InvalidEncodingError extends ApplicationError {
  constructor(message = 'Error with encoding.') {
    super(message, undefined, ErrorCodes.InvalidEncoding)
  }
}

/**
 * A custom error class returned when given submission has response that cannot be processed
 */
export class ProcessingError extends ApplicationError {
  constructor(message = 'Error processing response.') {
    super(message, undefined, ErrorCodes.SubmissionProcessing)
  }
}

/**
 * A custom error class returned when given submission has field validation failure
 */
export class ValidateFieldError extends ApplicationError {
  constructor(message = 'Error validating field.', status = 400) {
    super(message, status, ErrorCodes.ValidateField)
  }
}

/**
 * Error while sending confirmation email to recipients.
 */
export class SendEmailConfirmationError extends ApplicationError {
  constructor(message = 'Error while sending confirmation emails') {
    super(message, undefined, ErrorCodes.SendEmailConfirmation)
  }
}

/**
 * Attempt to submit form to wrong endpoint
 */
export class ResponseModeError extends ApplicationError {
  constructor(
    attemptedResponseMode: FormResponseMode | FormResponseMode[],
    formResponseMode: FormResponseMode,
  ) {
    super(
      `Attempted to submit ${formResponseMode} form to ${attemptedResponseMode} endpoint`,
      undefined,
      ErrorCodes.WrongResponseMode,
    )
  }
}

/**
 * Attachment greater than size limit
 */
export class AttachmentTooLargeError extends ApplicationError {
  constructor(message = 'Attachment size limit exceeded') {
    super(message, undefined, ErrorCodes.AttachmentTooLarge)
  }
}

/**
 * Generic error for errors thrown while receiving multipart form data
 */
export class InvalidFileExtensionError extends ApplicationError {
  constructor(message = 'Invalid file extension found in attachment') {
    super(message, undefined, ErrorCodes.InvalidFileExtension)
  }
}

export class SubmissionFailedError extends ApplicationError {
  constructor(
    message = 'The form submission could not be processed. Please try again.',
  ) {
    super(message, undefined, ErrorCodes.SubmissionFailed)
  }
}

export class InvalidFieldIdError extends ApplicationError {
  constructor(
    message = 'Invalid field id. Field id should be a valid MongoDB ObjectId.',
  ) {
    super(message, undefined, ErrorCodes.InvalidFieldId)
  }
}

export class AttachmentSizeLimitExceededError extends ApplicationError {
  constructor(
    message = `Total attachment size exceeds maximum file size limit. Please reduce your total attachment size and try again.`,
  ) {
    super(message, undefined, ErrorCodes.AttachmentSizeLimitExceeded)
  }
}

export class FeatureDisabledError extends ApplicationError {
  constructor(message = 'This feature is disabled.') {
    super(message, undefined, ErrorCodes.FeatureDisabled)
  }
}

export class InvalidFileKeyError extends ApplicationError {
  constructor(message = 'Invalid file key. File keys should be valid UUIDs.') {
    super(message, undefined, ErrorCodes.InvalidFileKey)
  }
}

export class VirusScanFailedError extends ApplicationError {
  constructor(message = 'Virus scan failed. Please try again.') {
    super(message, undefined, ErrorCodes.VirusScanFailed)
  }
}

export class JsonParseFailedError extends ApplicationError {
  constructor(message = 'JSON parsing failed. Please try again.') {
    super(message, undefined, ErrorCodes.JsonParseFailed)
  }
}

export class DownloadCleanFileFailedError extends ApplicationError {
  constructor(
    message = 'Attempt to download clean file failed. Please try again.',
  ) {
    super(message, undefined, ErrorCodes.DownloadCleanFileFailed)
  }
}

export class ParseVirusScannerLambdaPayloadError extends ApplicationError {
  constructor(message = 'Unexpected payload from virus scanning lambda.') {
    super(message, undefined, ErrorCodes.ParseVirusScannerLambdaPayload)
  }
}

export class MaliciousFileDetectedError extends ApplicationError {
  constructor(filename?: string) {
    super(
      `Your ${
        filename ? `file "${filename}"` : 'attachments(s)'
      } has failed our virus scan. Try to create and upload it again.`,
      undefined,
      ErrorCodes.MaliciousFileDetected,
    )
  }
}

export class InvalidWorkflowTypeError extends ApplicationError {
  constructor(
    message = 'Invalid workflow type encountered. Please contact the form admin and try again later.',
  ) {
    super(message, undefined, ErrorCodes.InvalidWorkflowType)
  }
}
