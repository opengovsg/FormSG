import { ApplicationError, ErrorCodes } from '../core/core.errors'

/**
 * Verified content has the wrong shape
 */
export class MalformedVerifiedContentError extends ApplicationError {
  constructor(message = 'Verified content is malformed') {
    super(message, undefined, ErrorCodes.VERIFIED_CONTENT_MALFORMED)
  }
}

/**
 * Error to be returned when verified content fails to be encrypted.
 */
export class EncryptVerifiedContentError extends ApplicationError {
  constructor(message = 'Failed to encrypt verified content') {
    super(message, undefined, ErrorCodes.VERIFIED_CONTENT_ENCRYPT_FAILURE)
  }
}
