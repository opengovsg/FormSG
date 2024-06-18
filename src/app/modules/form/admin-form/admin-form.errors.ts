import {
  GO_ALREADY_EXIST_ERROR_MESSAGE,
  GO_VALIDATION_ERROR_MESSAGE,
} from '../../../../../shared/constants'
import { ApplicationError } from '../../core/core.errors'

export class InvalidFileTypeError extends ApplicationError {
  constructor(message = 'Unsupported file type') {
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

// Family of GoGov Errors from GoGov Integration
export class GoGovError extends ApplicationError {
  constructor(message = 'Error occurred when claiming GoGov link') {
    super(message)
  }
}

export class GoGovValidationError extends GoGovError {
  constructor(message = GO_VALIDATION_ERROR_MESSAGE) {
    super(message)
  }
}

export class GoGovAlreadyExistError extends GoGovError {
  constructor(message = GO_ALREADY_EXIST_ERROR_MESSAGE) {
    super(message)
  }
}

export class GoGovRequestLimitError extends GoGovError {
  constructor(message = 'GoGov request limit exceeded') {
    super(message)
  }
}

export class GoGovBadGatewayError extends GoGovError {
  constructor(message = 'GoGov request failed') {
    super(message)
  }
}

export class GoGovServerError extends GoGovError {
  // Default error message will be shown if not AxiosError
  constructor(message = 'Unexpected error occured when claiming GoGov link') {
    super(message)
  }
}

export class AssistanceConnectionError extends ApplicationError {
  constructor(message = 'Error while connecting to OpenAI') {
    super(message)
  }
}

export class AssistanceModelTypeError extends ApplicationError {
  constructor(message = 'Unknown model type') {
    super(message)
  }
}
