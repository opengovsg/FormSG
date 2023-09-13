import { CreatePresignedPostError } from '../../../utils/aws-s3'
import { ApplicationError } from '../../core/core.errors'

export class InvalidFileTypeError extends ApplicationError {
  constructor(message = 'Unsupported file type') {
    super(message)
  }
}

export class CreatePresignedUrlError extends CreatePresignedPostError {
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

export class PaymentChannelNotFoundError extends ApplicationError {
  constructor(
    message = 'Please ensure that you have connected your Stripe account in settings to save this field',
  ) {
    super(message)
  }
}

export class GoGovError extends ApplicationError {
  constructor(message = 'Error occurred when claiming GoGov link') {
    super(message)
  }
}
