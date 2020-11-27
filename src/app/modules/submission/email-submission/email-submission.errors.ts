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

export class GenericMultipartError extends ApplicationError {
  constructor(message = 'Error while receiving multipart content') {
    super(message)
  }
}
