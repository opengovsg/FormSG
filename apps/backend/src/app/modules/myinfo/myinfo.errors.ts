import { ApplicationError, ErrorCodes } from '../core/core.errors'

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
