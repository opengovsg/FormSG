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
 * TODO(#5452): Delete this error
 * Submission on MyInfo form missing access token.
 */
export class MyInfoMissingAccessTokenError extends ApplicationError {
  constructor(message = 'Access token not present on MyInfo submission') {
    super(message)
  }
}

/**
 * Submission on MyInfo form missing access token.
 */
export class MyInfoMissingLoginCookieError extends ApplicationError {
  constructor(message = 'Login cookie not present on MyInfo submission') {
    super(message)
  }
}

/**
 * Access token on submission for MyInfo form is invalid.
 */
export class MyInfoInvalidLoginCookieError extends ApplicationError {
  constructor(message = 'Login cookie could not be verified') {
    super(message)
  }
}

/**
 * Cookie containing auth code is malformed.
 */
export class MyInfoInvalidAuthCodeCookieError extends ApplicationError {
  constructor(cookie: unknown, message = 'Auth code cookie is malformed') {
    super(`${message}: ${cookie}`)
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
