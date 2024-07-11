import { ApplicationError, ErrorCodes } from '../../core/core.errors'

/**
 * Error in headers passed to Busboy constructor
 */
export class InitialiseMultipartReceiverError extends ApplicationError {
  constructor(message = 'Error while initialising multipart receiver') {
    super(message, undefined, ErrorCodes.RECEIVER_INITIALISE_MULTIPART_RECEIVER)
  }
}

/**
 * Submission size too large
 */
export class MultipartContentLimitError extends ApplicationError {
  constructor(message = 'Multipart content size limit exceeded') {
    super(message, undefined, ErrorCodes.RECEIVER_MULTIPART_CONTENT_LIMIT)
  }
}

/**
 * Could not parse response body
 */
export class MultipartContentParsingError extends ApplicationError {
  constructor(message = 'Could not parse multipart form content') {
    super(message, undefined, ErrorCodes.RECEIVER_MULTIPART_CONTENT_PARSING)
  }
}

export class MultipartError extends ApplicationError {
  constructor(message = 'Error while receiving multipart content') {
    super(message, undefined, ErrorCodes.RECEIVER_MULTIPART_ERROR)
  }
}
