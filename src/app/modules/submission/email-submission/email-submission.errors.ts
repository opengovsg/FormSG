import { ApplicationError } from '../../core/core.errors'

export class InitialiseMultipartReceiverError extends ApplicationError {
  constructor(message = 'Error while initialising multipart receiver') {
    super(message)
  }
}

export class MultipartContentLimitError extends ApplicationError {
  constructor(message = 'Multipart content size limit exceeded') {
    super(message)
  }
}

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

export class InvalidFileExtensionError extends ApplicationError {
  constructor(message = 'Invalid file extension found in attachment') {
    super(message)
  }
}

export class AttachmentTooLargeError extends ApplicationError {
  constructor(message = 'Attachment size limit exceeded') {
    super(message)
  }
}
