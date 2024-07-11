import {
  GO_ALREADY_EXIST_ERROR_MESSAGE,
  GO_VALIDATION_ERROR_MESSAGE,
} from '../../../../../shared/constants'
import { ApplicationError, ErrorCodes } from '../../core/core.errors'

export class InvalidFileTypeError extends ApplicationError {
  constructor(message = 'Unsupported file type') {
    super(message, undefined, ErrorCodes.ADMIN_FORM_INVALID_FILE_TYPE)
  }
}

export class EditFieldError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.ADMIN_FORM_EDIT_FIELD)
  }
}

export class FieldNotFoundError extends ApplicationError {
  constructor(message = 'Field to modify not found') {
    super(message, undefined, ErrorCodes.ADMIN_FORM_FIELD_NOT_FOUND)
  }
}

export class InvalidCollaboratorError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.ADMIN_FORM_INVALID_COLLABORATOR)
  }
}

export class PaymentChannelNotFoundError extends ApplicationError {
  constructor(
    message = 'Please ensure that you have connected your Stripe account in settings to save this field',
  ) {
    super(message, undefined, ErrorCodes.ADMIN_FORM_PAYMENT_CHANNEL_NOT_FOUND)
  }
}

// Family of GoGov Errors from GoGov Integration
export class GoGovError extends ApplicationError {
  constructor(
    message = 'Error occurred when claiming GoGov link',
    errorCode?: ErrorCodes,
  ) {
    super(message, undefined, errorCode || ErrorCodes.ADMIN_FORM_GOGOV)
  }
}

export class GoGovValidationError extends GoGovError {
  constructor(message = GO_VALIDATION_ERROR_MESSAGE) {
    super(message, ErrorCodes.ADMIN_FORM_GOGOV_VALIDATION)
  }
}

export class GoGovAlreadyExistError extends GoGovError {
  constructor(message = GO_ALREADY_EXIST_ERROR_MESSAGE) {
    super(message, ErrorCodes.ADMIN_FORM_GOGOV_ALREADY_EXIST)
  }
}

export class GoGovRequestLimitError extends GoGovError {
  constructor(message = 'GoGov request limit exceeded') {
    super(message, ErrorCodes.ADMIN_FORM_GOGOV_REQUEST_LIMIT)
  }
}

export class GoGovBadGatewayError extends GoGovError {
  constructor(message = 'GoGov request failed') {
    super(message, ErrorCodes.ADMIN_FORM_GOGOV_BAD_GATEWAY)
  }
}

export class GoGovServerError extends GoGovError {
  // Default error message will be shown if not AxiosError
  constructor(message = 'Unexpected error occured when claiming GoGov link') {
    super(message, ErrorCodes.ADMIN_FORM_GOGOV_SERVER)
  }
}
