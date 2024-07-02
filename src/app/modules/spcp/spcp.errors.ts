import { ApplicationError, ErrorCodes } from '../../modules/core/core.errors'

/**
 * Error while creating redirect URL
 */
export class CreateRedirectUrlError extends ApplicationError {
  constructor(message = 'Error while creating redirect URL') {
    super(message, undefined, ErrorCodes.CreateRedirectUrl)
  }
}

/**
 * JWT could not be decoded.
 */
export class VerifyJwtError extends ApplicationError {
  constructor(message = 'Invalid JWT') {
    super(message, undefined, ErrorCodes.VerifyJwt)
  }
}

/**
 * Attributes given by SP/CP did not contain NRIC or entity ID/UID.
 */
export class MissingAttributesError extends ApplicationError {
  constructor(
    message = 'Attributes given by SP/CP did not contain NRIC or entity ID/UID.',
  ) {
    super(message, undefined, ErrorCodes.MissingAttributes)
  }
}

/**
 * JWT could be decoded but has the wrong shape
 */
export class InvalidJwtError extends ApplicationError {
  constructor(
    message = 'Decoded JWT did not contain the correct SPCP attributes',
  ) {
    super(message, undefined, ErrorCodes.InvalidJwt)
  }
}

/**
 * JWT not present in cookies
 */
export class MissingJwtError extends ApplicationError {
  constructor(message = 'No JWT present in cookies') {
    super(message, undefined, ErrorCodes.MissingJwt)
  }
}

/**
 * idToken has invalid shape
 */
export class InvalidIdTokenError extends ApplicationError {
  constructor(message = 'idToken has invalid shape') {
    super(message, undefined, ErrorCodes.InvalidIdToken)
  }
}

/**
 * Invalid state
 */
export class InvalidStateError extends ApplicationError {
  constructor(message = 'Unable to parse invalid state') {
    super(message, undefined, ErrorCodes.InvalidState)
  }
}

/**
 * Failed to create JWT
 */
export class CreateJwtError extends ApplicationError {
  constructor(message = 'Create JWT failed') {
    super(message, undefined, ErrorCodes.CreateJwt)
  }
}

/**
 * Failed to exchange auth code for nric
 */
export class ExchangeAuthTokenError extends ApplicationError {
  constructor(message = 'Exchange auth code for nric failed') {
    super(message, undefined, ErrorCodes.ExchangeAuthToken)
  }
}
