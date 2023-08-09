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
