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
