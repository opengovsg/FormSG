import { AuthType } from '../../../types'
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

/**
 * Invalid JWT.
 */
export class VerifyJwtError extends ApplicationError {
  constructor(message = 'Invalid JWT') {
    super(message)
  }
}

/*
 * Invalid OOB params passed to login endpoint.
 */
export class InvalidOOBParamsError extends ApplicationError {
  constructor(message = 'Invalid OOB params passed to login endpoint') {
    super(message)
  }
}

/**
 * Error while attempting to retrieve SPCP attributes from SPCP server
 */
export class RetrieveAttributesError extends ApplicationError {
  constructor(message = 'Failed to retrieve attributes from SPCP') {
    super(message)
  }
}

/**
 * Destination form not found.
 */
export class FormNotFoundError extends ApplicationError {
  constructor(
    message = 'Could not find form with ID specified in relay state',
  ) {
    super(message)
  }
}

/**
 * Form auth type did not match attempted auth method.
 */
export class AuthTypeMismatchError extends ApplicationError {
  constructor(attemptedAuthType: AuthType, formAuthType: AuthType) {
    super(
      `Attempted authentication type ${attemptedAuthType} did not match form auth type ${formAuthType}`,
    )
  }
}
