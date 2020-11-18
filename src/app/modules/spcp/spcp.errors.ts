import { ApplicationError } from '../../modules/core/core.errors'
/**
 * Error while creating redirect URL
 */
export class CreateRedirectUrlError extends ApplicationError {
  constructor(message = 'Error while creating redirect URL') {
    super(message)
  }
}

/**
 * Invalid authType given.
 */
export class InvalidAuthTypeError extends ApplicationError {
  constructor(authType: unknown) {
    super(`Invalid authType: ${authType}`)
  }
}

/**
 * Error while fetching SP/CP login page.
 */
export class FetchLoginPageError extends ApplicationError {
  constructor(message = 'Error while fetching SP/CP login page') {
    super(message)
  }
}

/**
 * Invalid SP/CP login page.
 */
export class LoginPageValidationError extends ApplicationError {
  constructor(message = 'Invalid SP/CP login page') {
    super(message)
  }
}
