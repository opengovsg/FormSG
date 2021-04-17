import { ApplicationError } from '../core/core.errors'

/**
 * Circuit breaker is open
 */
export class MyInfoCircuitBreakerError extends ApplicationError {
  constructor(message = 'Circuit breaker tripped') {
    super(message)
  }
}

/**
 * Error while attempting to retrieve MyInfo data from the MyInfo API
 */
export class MyInfoFetchError extends ApplicationError {
  constructor(message = 'Error while requesting MyInfo data') {
    super(message)
  }
}

/**
 * Error while attempting to hash data or compare hashed data
 */
export class MyInfoHashingError extends ApplicationError {
  constructor(message = 'Error occurred while hashing data') {
    super(message)
  }
}

/**
 * Hashes not found in the database
 */
export class MyInfoMissingHashError extends ApplicationError {
  constructor(message = 'Requested hashes not found in database') {
    super(message)
  }
}

/**
 * Hashes did not match responses
 */
export class MyInfoHashDidNotMatchError extends ApplicationError {
  constructor(message = 'Responses did not match hashed values') {
    super(message)
  }
}

/**
 * Relay state forwarded by MyInfo did not have expected shape.
 */
export class MyInfoParseRelayStateError extends ApplicationError {
  constructor(
    message = 'Relay state received from MyInfo had incorrect format',
  ) {
    super(message)
  }
}

/**
 * Attempt to perform a MyInfo-related operation on a form without MyInfo
 * authentication enabled.
 */
export class MyInfoAuthTypeError extends ApplicationError {
  constructor(
    message = 'MyInfo function called on form without MyInfo authentication type',
  ) {
    super(message)
  }
}

/**
 * MyInfo form missing e-service ID.
 */
export class MyInfoNoESrvcIdError extends ApplicationError {
  constructor(message = 'Form does not have e-service ID') {
    super(message)
  }
}

/**
 * Submission on MyInfo form missing access token.
 */
export class MyInfoMissingAccessTokenError extends ApplicationError {
  constructor(message = 'Access token not present on MyInfo submission') {
    super(message)
  }
}

/**
 * Access token on submission for MyInfo form is invalid.
 */
export class MyInfoInvalidAccessTokenError extends ApplicationError {
  constructor(message = 'Access token could not be verified') {
    super(message)
  }
}

/**
 * MyInfo cookie on submission is in error state.
 */
export class MyInfoCookieStateError extends ApplicationError {
  constructor(message = 'MyInfo cookie is in error state') {
    super(message)
  }
}

/**
 * MyInfo cookie has been used more than once
 */
export class MyInfoCookieAccessError extends ApplicationError {
  constructor(message = 'MyInfo cookie has already been used') {
    super(message)
  }
}

/**
 * MyInfo form has too many MyInfo fields
 */
export class MyInfoTooManyFieldsError extends ApplicationError {
  constructor(message = 'MyInfo form has too many fields') {
    super(message)
  }
}
