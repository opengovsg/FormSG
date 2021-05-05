import { ApplicationError } from '../../core/core.errors'

/**
 * Error in headers passed to Busboy constructor
 */
export class InitialiseMultipartReceiverError extends ApplicationError {
  constructor(message = 'Error while initialising multipart receiver') {
    super(message)
  }
}

/**
 * Submission size too large
 */
export class MultipartContentLimitError extends ApplicationError {
  constructor(message = 'Multipart content size limit exceeded') {
    super(message)
  }
}

/**
 * Could not parse response body
 */
export class MultipartContentParsingError extends ApplicationError {
  constructor(message = 'Could not parse multipart form content') {
    super(message)
  }
}

export class MultipartError extends ApplicationError {
  constructor(message = 'Error while receiving multipart content') {
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
