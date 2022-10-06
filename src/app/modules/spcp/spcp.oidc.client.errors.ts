import { ApplicationError } from '../core/core.errors'

/**
 * Error while creating Authorisation URL
 */
export class CreateAuthorisationUrlError extends ApplicationError {
  constructor(message = 'Error while creating Authorisation URL') {
    super(message)
  }
}

/**
 * Failed to create JWT
 */
export class CreateJwtError extends ApplicationError {
  constructor(message = 'Create JWT failed') {
    super(message)
  }
}

/**
 * Failed to get signing key
 */
export class GetSigningKeyError extends ApplicationError {
  constructor(message = 'Failed to get signing key') {
    super(message)
  }
}

/**
 * Failed to get decryption key
 */
export class GetDecryptionKeyError extends ApplicationError {
  constructor(message = 'Failed to get decryption key') {
    super(message)
  }
}

/**
 * Failed to get verification key
 */
export class GetVerificationKeyError extends ApplicationError {
  constructor(message = 'Failed to get verification key') {
    super(message)
  }
}

/**
 * idToken has invalid shape
 */
export class InvalidIdTokenError extends ApplicationError {
  constructor(message = 'idToken has invalid shape') {
    super(message)
  }
}

/**
 * JWK shape invalid
 */
export class JwkError extends ApplicationError {
  constructor(message = 'Jwk has invalid shape') {
    super(message)
  }
}

/**
 * Missing idToken in tokenset
 */
export class MissingIdTokenError extends ApplicationError {
  constructor(message = 'Missing id token in tokenset') {
    super(message)
  }
}

/**
 * Invalid verification key
 */
export class VerificationKeyError extends ApplicationError {
  constructor(message = 'Verification key invalid') {
    super(message)
  }
}

/**
 * Failed to exchange auth code for nric
 */
export class ExchangeAuthTokenError extends ApplicationError {
  constructor(message = 'Exchange auth code for nric failed') {
    super(message)
  }
}
