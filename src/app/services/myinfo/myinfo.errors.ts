import { ApplicationError } from '../../modules/core/core.errors'

/**
 * Circuit breaker is open
 */
export class CircuitBreakerError extends ApplicationError {
  constructor(message?: string) {
    super(message ?? 'Circuit breaker tripped')
  }
}

/**
 * Error while attempting to retrieve MyInfo data from the MyInfo API
 */
export class FetchMyInfoError extends ApplicationError {
  constructor(message?: string) {
    super(message ?? 'Error while requesting MyInfo data')
  }
}

/**
 * Error while attempting to hash data or compare hashed data
 */
export class HashingError extends ApplicationError {
  constructor(message?: string) {
    super(message ?? 'Error occurred while hashing data')
  }
}

/**
 * Hashes not found in the database
 */
export class MissingHashError extends ApplicationError {
  constructor(message?: string) {
    super(message ?? 'Requested hashes not found in database')
  }
}

/**
 * Hashes did not match responses
 */
export class HashDidNotMatchError extends ApplicationError {
  constructor(message?: string) {
    super(message ?? 'Responses did not match hashed values')
  }
}
