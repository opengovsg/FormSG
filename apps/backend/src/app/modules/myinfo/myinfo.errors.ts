import { ApplicationError, ErrorCodes } from '../core/core.errors'

/**
 * Circuit breaker is open
 */
export class MyInfoCircuitBreakerError extends ApplicationError {
  constructor(message = 'Circuit breaker tripped') {
    super(message, undefined, ErrorCodes.MYINFO_CIRCUIT_BREAKER)
  }
}

/**
 * Error while attempting to retrieve MyInfo data from the MyInfo API
 */
export class MyInfoFetchError extends ApplicationError {
  constructor(message = 'Error while requesting MyInfo data') {
    super(message, undefined, ErrorCodes.MYINFO_FETCH)
  }
}

/**
 * Error while attempting to hash data or compare hashed data
 */
export class MyInfoHashingError extends ApplicationError {
  constructor(message = 'Error occurred while hashing data') {
    super(message, undefined, ErrorCodes.MYINFO_HASHING)
  }
}

/**
 * Hashes not found in the database
 */
export class MyInfoMissingHashError extends ApplicationError {
  constructor(message = 'Requested hashes not found in database') {
    super(message, undefined, ErrorCodes.MYINFO_MISSING_HASH)
  }
}

/**
 * Hashes did not match responses
 */
export class MyInfoHashDidNotMatchError extends ApplicationError {
  constructor(message = 'Responses did not match hashed values') {
    super(message, undefined, ErrorCodes.MYINFO_HASH_DID_NOT_MATCH)
  }
}

/**
 * Relay state forwarded by MyInfo did not have expected shape.
 */
export class MyInfoParseRelayStateError extends ApplicationError {
  constructor(
    message = 'Relay state received from MyInfo had incorrect format',
  ) {
    super(message, undefined, ErrorCodes.MYINFO_PARSE_RELAY_STATE)
  }
}

/**
 * Submission on MyInfo form missing access token.
 */
export class MyInfoMissingLoginCookieError extends ApplicationError {
  constructor(message = 'Login cookie not present on MyInfo submission') {
    super(message, undefined, ErrorCodes.MYINFO_MISSING_LOGIN_COOKIE)
  }
}

/**
 * Access token on submission for MyInfo form is invalid.
 */
export class MyInfoInvalidLoginCookieError extends ApplicationError {
  constructor(message = 'Login cookie could not be verified') {
    super(message, undefined, ErrorCodes.MYINFO_INVALID_LOGIN_COOKIE)
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
      ErrorCodes.MYINFO_INVALID_AUTH_CODE_COOKIE,
    )
  }
}

/**
 * MyInfo cookie on submission is in error state.
 */
export class MyInfoCookieStateError extends ApplicationError {
  constructor(message = 'MyInfo cookie is in error state') {
    super(message, undefined, ErrorCodes.MYINFO_COOKIE_STATE)
  }
}
