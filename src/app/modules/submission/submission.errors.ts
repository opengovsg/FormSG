import { FormResponseMode } from '../../../../shared/types'
import { ApplicationError, ErrorCodes } from '../core/core.errors'

/**
 * A custom error class thrown by the submission controllers
 * when some form fields are missing from the submission
 */
export class ConflictError extends ApplicationError {
  constructor(message: string, meta?: unknown) {
    super(message, meta, ErrorCodes.SUBMISSION_CONFLICT)
  }
}

export class SubmissionNotFoundError extends ApplicationError {
  constructor(message = 'Submission not found for given ID') {
    super(message, undefined, ErrorCodes.SUBMISSION_NOT_FOUND)
  }
}

export class PendingSubmissionNotFoundError extends ApplicationError {
  constructor(message = 'Pending submission not found for given ID') {
    super(message, undefined, ErrorCodes.SUBMISSION_PENDING_NOT_FOUND)
  }
}

export class InvalidSubmissionTypeError extends ApplicationError {
  constructor(message = 'Unexpected submission type encountered.') {
    super(message, undefined, ErrorCodes.SUBMISSION_INVALID_TYPE)
  }
}

/**
 * A custom error class returned when given submission has invalid encryption encoding
 */
export class InvalidEncodingError extends ApplicationError {
  constructor(message = 'Error with encoding.') {
    super(message, undefined, ErrorCodes.SUBMISSION_INVALID_ENCODING)
  }
}

/**
 * A custom error class returned when given submission has response that cannot be processed
 */
export class ProcessingError extends ApplicationError {
  constructor(message = 'Error processing response.') {
    super(message, undefined, ErrorCodes.SUBMISSION_PROCESSING)
  }
}

/**
 * A custom error class returned when given submission has field validation failure
 */
export class ValidateFieldError extends ApplicationError {
  constructor(message = 'Error validating field.', status = 400) {
    super(message, status, ErrorCodes.SUBMISSION_VALIDATE_FIELD)
  }
}

/**
 * Error while sending confirmation email to recipients.
 */
export class SendEmailConfirmationError extends ApplicationError {
  constructor(message = 'Error while sending confirmation emails') {
    super(message, undefined, ErrorCodes.SUBMISSION_SEND_EMAIL_CONFIRMATION)
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
      ErrorCodes.SUBMISSION_WRONG_RESPONSE_MODE,
    )
  }
}

export class UnsupportedSettingsError extends ApplicationError {
  constructor(reason: string) {
    super(`Unsupported form setting found: ${reason}`)
  }
}

/**
 * Attachment greater than size limit
 */
export class AttachmentTooLargeError extends ApplicationError {
  constructor(message = 'Attachment size limit exceeded') {
    super(message, undefined, ErrorCodes.SUBMISSION_ATTACHMENT_TOO_LARGE)
  }
}

/**
 * Generic error for errors thrown while receiving multipart form data
 */
export class InvalidFileExtensionError extends ApplicationError {
  constructor(message = 'Invalid file extension found in attachment') {
    super(message, undefined, ErrorCodes.SUBMISSION_INVALID_FILE_EXTENSION)
  }
}

export class SubmissionFailedError extends ApplicationError {
  constructor(
    message = 'The form submission could not be processed. Please try again.',
  ) {
    super(message, undefined, ErrorCodes.SUBMISSION_FAILED)
  }
}

export class InvalidFieldIdError extends ApplicationError {
  constructor(
    message = 'Invalid field id. Field id should be a valid MongoDB ObjectId.',
  ) {
    super(message, undefined, ErrorCodes.SUBMISSION_INVALID_FIELD_ID)
  }
}

export class AttachmentSizeLimitExceededError extends ApplicationError {
  constructor(
    message = `Total attachment size exceeds maximum file size limit. Please reduce your total attachment size and try again.`,
  ) {
    super(
      message,
      undefined,
      ErrorCodes.SUBMISSION_ATTACHMENT_SIZE_LIMIT_EXCEEDED,
    )
  }
}

export class FeatureDisabledError extends ApplicationError {
  constructor(message = 'This feature is disabled.') {
    super(message, undefined, ErrorCodes.SUBMISSION_FEATURE_DISABLED)
  }
}

export class InvalidFileKeyError extends ApplicationError {
  constructor(message = 'Invalid file key. File keys should be valid UUIDs.') {
    super(message, undefined, ErrorCodes.SUBMISSION_INVALID_FILE_KEY)
  }
}

export class VirusScanFailedError extends ApplicationError {
  constructor(message = 'Virus scan failed. Please try again.') {
    super(message, undefined, ErrorCodes.SUBMISSION_VIRUS_SCAN_FAILED)
  }
}

export class JsonParseFailedError extends ApplicationError {
  constructor(message = 'JSON parsing failed. Please try again.') {
    super(message, undefined, ErrorCodes.SUBMISSION_JSON_PARSE_FAILED)
  }
}

export class DownloadCleanFileFailedError extends ApplicationError {
  constructor(
    message = 'Attempt to download clean file failed. Please try again.',
  ) {
    super(message, undefined, ErrorCodes.SUBMISSION_DOWNLOAD_CLEAN_FILE_FAILED)
  }
}

export class ParseVirusScannerLambdaPayloadError extends ApplicationError {
  constructor(message = 'Unexpected payload from virus scanning lambda.') {
    super(
      message,
      undefined,
      ErrorCodes.SUBMISSION_PARSE_VIRUS_SCANNER_LAMBDA_PAYLOAD,
    )
  }
}

export class MaliciousFileDetectedError extends ApplicationError {
  constructor(filename?: string) {
    super(
      `Your ${
        filename ? `file "${filename}"` : 'attachments(s)'
      } has failed our virus scan. Try to create and upload it again.`,
      undefined,
      ErrorCodes.SUBMISSION_MALICIOUS_FILE_DETECTED,
    )
  }
}

export class InvalidWorkflowTypeError extends ApplicationError {
  constructor(
    message = 'Invalid workflow type encountered. Please contact the form admin and try again later.',
  ) {
    super(message, undefined, ErrorCodes.SUBMISSION_INVALID_WORKFLOW_TYPE)
  }
}

/**
 * Error thrown when attachment upload fails
 */
export class AttachmentUploadError extends ApplicationError {
  constructor(message = 'Error while uploading encrypted attachments to S3') {
    super(message, undefined, ErrorCodes.SUBMISSION_ATTACHMENT_UPLOAD)
  }
}

export class InvalidApprovalFieldTypeError extends ApplicationError {
  constructor(
    message = 'Invalid field type for approval step selected. Please select a Yes/No field',
  ) {
    super(message, undefined, ErrorCodes.ADMIN_FORM_INVALID_APPROVAL_FIELD_TYPE)
  }
}

export class ExpectedResponseNotFoundError extends ApplicationError {
  constructor(
    message = 'Response for the Yes/No field for this approval step is not found',
  ) {
    super(message, undefined, ErrorCodes.SUBMISSION_EXPECTED_RESPONSE_NOT_FOUND)
  }
}
