/**
 * Error while creating Authorisation URL
 */
export class CreateAuthorisationUrlError extends Error {
  constructor(message = 'Error while creating Authorisation URL') {
    super(message)
  }
}

/**
 * Failed to create JWT
 */
export class CreateJwtError extends Error {
  constructor(message = 'Create JWT failed') {
    super(message)
  }
}

/**
 * Failed to get decryption key
 */
export class GetDecryptionKeyError extends Error {
  constructor(message = 'Failed to get decryption key') {
    super(message)
  }
}

/**
 * Failed to get verification key
 */
export class GetVerificationKeyError extends Error {
  constructor(message = 'Failed to get verification key') {
    super(message)
  }
}

/**
 * idToken has invalid shape
 */
export class InvalidIdTokenError extends Error {
  constructor(message = 'idToken has invalid shape') {
    super(message)
  }
}

/**
 * JWK shape invalid
 */
export class JwkError extends Error {
  constructor(message = 'Jwk has invalid shape') {
    super(message)
  }
}

/**
 * Missing idToken in tokenset
 */
export class MissingIdTokenError extends Error {
  constructor(message = 'Missing id token in tokenset') {
    super(message)
  }
}

/**
 * Invalid verification key
 */
export class VerificationKeyError extends Error {
  constructor(message = 'Verification key invalid') {
    super(message)
  }
}
