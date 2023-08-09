import { ApplicationError } from '../../core/core.errors'

/**
 * Generic error for errors thrown while receiving multipart form data
 */
export class InvalidFileExtensionError extends ApplicationError {
  constructor(message = 'Invalid file extension found in attachment') {
    super(message)
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

export class SubmissionHashError extends ApplicationError {
  constructor(message = 'Error occurred while attempting to hash submission') {
    super(message)
  }
}
