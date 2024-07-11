import { ApplicationError, ErrorCodes } from '../core/core.errors'

/**
 * Circuit breaker is open
 */
export class MyInfoCircuitBreakerError extends ApplicationError {
  constructor(message = 'Circuit breaker tripped') {
    super(message, undefined, ErrorCodes.MyInfoCircuitBreaker)
  }
}

/**
 * Error while attempting to retrieve MyInfo data from the MyInfo API
 */
export class MyInfoFetchError extends ApplicationError {
  constructor(message = 'Error while requesting MyInfo data') {
    super(message, undefined, ErrorCodes.MyInfoFetch)
  }
}

/**
 * Error while attempting to hash data or compare hashed data
 */
export class MyInfoHashingError extends ApplicationError {
  constructor(message = 'Error occurred while hashing data') {
    super(message, undefined, ErrorCodes.MyInfoHashing)
  }
}

/**
 * Hashes not found in the database
 */
export class MyInfoMissingHashError extends ApplicationError {
  constructor(message = 'Requested hashes not found in database') {
    super(message, undefined, ErrorCodes.MyInfoMissingHash)
  }
}

/**
 * Hashes did not match responses
 */
export class MyInfoHashDidNotMatchError extends ApplicationError {
  constructor(message = 'Responses did not match hashed values') {
    super(message, undefined, ErrorCodes.MyInfoHashDidNotMatch)
  }
}

/**
 * Relay state forwarded by MyInfo did not have expected shape.
 */
export class MyInfoParseRelayStateError extends ApplicationError {
  constructor(
    message = 'Relay state received from MyInfo had incorrect format',
  ) {
    super(message, undefined, ErrorCodes.MyinfoParseRelayState)
  }
}

/**
 * Submission on MyInfo form missing access token.
 */
export class MyInfoMissingLoginCookieError extends ApplicationError {
  constructor(message = 'Login cookie not present on MyInfo submission') {
    super(message, undefined, ErrorCodes.MyInfoMissingLoginCookie)
  }
}

/**
 * Access token on submission for MyInfo form is invalid.
 */
export class MyInfoInvalidLoginCookieError extends ApplicationError {
  constructor(message = 'Login cookie could not be verified') {
    super(message, undefined, ErrorCodes.MyInfoInvalidLoginCookie)
  }
}

/**
 * Cookie containing auth code is malformed.
 */
export class MyInfoInvalidAuthCodeCookieError extends ApplicationError {
  constructor(cookie: unknown, message = 'Auth code cookie is malformed') {
    super(
      `${message}: ${cookie}`,
      undefined,
      ErrorCodes.MyInfoInvalidAuthCodeCookie,
    )
  }
}

/**
 * MyInfo cookie on submission is in error state.
 */
export class MyInfoCookieStateError extends ApplicationError {
  constructor(message = 'MyInfo cookie is in error state') {
    super(message, undefined, ErrorCodes.MyInfoCookieState)
  }
}
