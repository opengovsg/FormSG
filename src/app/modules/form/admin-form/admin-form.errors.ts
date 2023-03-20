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

export class EditFieldError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}

export class FieldNotFoundError extends ApplicationError {
  constructor(message = 'Field to modify not found') {
    super(message)
  }
}

export class InvalidCollaboratorError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}
