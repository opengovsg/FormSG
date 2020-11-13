import { ApplicationError } from '../../core/core.errors'

export class InvalidFileTypeError extends ApplicationError {
  constructor(message = 'Unsupported file type') {
    super(message)
  }
}

export class CreatePresignedUrlError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}
