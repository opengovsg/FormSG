import { ApplicationError, ErrorCodes } from '../core/core.errors'

/**
 * Error while creating Authorisation URL
 */
export class CreateAuthorisationUrlError extends ApplicationError {
  constructor(message = 'Error while creating Authorisation URL') {
    super(message, undefined, ErrorCodes.SPCP_OIDC_CREATE_AUTHORISATION_URL)
  }
}

/**
 * Failed to create JWT
 */
export class CreateJwtError extends ApplicationError {
  constructor(message = 'Create JWT failed') {
    super(message, undefined, ErrorCodes.SPCP_OIDC_CREATE_JWT)
  }
}

/**
 * Failed to get signing key
 */
export class GetSigningKeyError extends ApplicationError {
  constructor(message = 'Failed to get signing key') {
    super(message, undefined, ErrorCodes.SPCP_OIDC_GET_SIGNING_KEY)
  }
}

/**
 * Failed to get decryption key
 */
export class GetDecryptionKeyError extends ApplicationError {
  constructor(message = 'Failed to get decryption key') {
    super(message, undefined, ErrorCodes.SPCP_OIDC_GET_DECRYPTION_KEY)
  }
}

/**
 * Failed to get verification key
 */
export class GetVerificationKeyError extends ApplicationError {
  constructor(message = 'Failed to get verification key') {
    super(message, undefined, ErrorCodes.SPCP_OIDC_GET_VERIFICATION_KEY)
  }
}

/**
 * idToken has invalid shape
 */
export class InvalidIdTokenError extends ApplicationError {
  constructor(message = 'idToken has invalid shape') {
    super(message, undefined, ErrorCodes.SPCP_OIDC_INVALID_ID_TOKEN)
  }
}

/**
 * JWK shape invalid
 */
export class JwkError extends ApplicationError {
  constructor(message = 'Jwk has invalid shape') {
    super(message, undefined, ErrorCodes.SPCP_OIDC_JWK_SHAPE_INVALID)
  }
}

/**
 * Missing idToken in tokenset
 */
export class MissingIdTokenError extends ApplicationError {
  constructor(message = 'Missing id token in tokenset') {
    super(message, undefined, ErrorCodes.SPCP_OIDC_MISSING_ID_TOKEN)
  }
}

/**
 * Invalid verification key
 */
export class VerificationKeyError extends ApplicationError {
  constructor(message = 'Verification key invalid') {
    super(message, undefined, ErrorCodes.SPCP_OIDC_INVALID_VERIFICATION_KEY)
  }
}

/**
 * Failed to exchange auth code for nric
 */
export class ExchangeAuthTokenError extends ApplicationError {
  constructor(message = 'Exchange auth code for nric failed') {
    super(message, undefined, ErrorCodes.SPCP_OIDC_EXCHANGE_AUTH_TOKEN)
  }
}
