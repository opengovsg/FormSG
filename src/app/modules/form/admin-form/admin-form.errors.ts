import {
  GO_ALREADY_EXIST_ERROR_MESSAGE,
  GO_VALIDATION_ERROR_MESSAGE,
} from '../../../../../shared/constants'
import { ApplicationError, ErrorCodes } from '../../core/core.errors'

export class InvalidFileTypeError extends ApplicationError {
  constructor(message = 'Unsupported file type') {
    super(message, undefined, ErrorCodes.InvalidFileType)
  }
}

export class EditFieldError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.EditField)
  }
}

export class FieldNotFoundError extends ApplicationError {
  constructor(message = 'Field to modify not found') {
    super(message, undefined, ErrorCodes.FieldNotFound)
  }
}

export class InvalidCollaboratorError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.InvalidCollaborator)
  }
}

export class PaymentChannelNotFoundError extends ApplicationError {
  constructor(
    message = 'Please ensure that you have connected your Stripe account in settings to save this field',
  ) {
    super(message, undefined, ErrorCodes.PaymentChannelNotFound)
  }
}

// Family of GoGov Errors from GoGov Integration
export class GoGovError extends ApplicationError {
  constructor(
    message = 'Error occurred when claiming GoGov link',
    errorCode?: ErrorCodes,
  ) {
    super(message, undefined, errorCode || ErrorCodes.GoGov)
  }
}

export class GoGovValidationError extends GoGovError {
  constructor(message = GO_VALIDATION_ERROR_MESSAGE) {
    super(message, ErrorCodes.GoGovValidation)
  }
}

export class GoGovAlreadyExistError extends GoGovError {
  constructor(message = GO_ALREADY_EXIST_ERROR_MESSAGE) {
    super(message, ErrorCodes.GoGovAlreadyExist)
  }
}

export class GoGovRequestLimitError extends GoGovError {
  constructor(message = 'GoGov request limit exceeded') {
    super(message, ErrorCodes.GoGovRequestLimit)
  }
}

export class GoGovBadGatewayError extends GoGovError {
  constructor(message = 'GoGov request failed') {
    super(message, ErrorCodes.GoGovBadGateway)
  }
}

export class GoGovServerError extends GoGovError {
  // Default error message will be shown if not AxiosError
  constructor(message = 'Unexpected error occured when claiming GoGov link') {
    super(message, ErrorCodes.GoGovServer)
  }
}
