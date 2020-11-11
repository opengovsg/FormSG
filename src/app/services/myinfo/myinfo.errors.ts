import { ApplicationError } from '../../modules/core/core.errors'

export class CircuitBreakerError extends ApplicationError {
  constructor(message?: string) {
    super(message ?? 'Circuit breaker tripped')
  }
}

export class FetchMyInfoError extends ApplicationError {
  constructor(message?: string) {
    super(message ?? 'Error while requesting MyInfo data')
  }
}

export class HashingError extends ApplicationError {
  constructor(message?: string) {
    super(message ?? 'Error occurred while hashing data')
  }
}

export class MissingHashError extends ApplicationError {
  constructor(message?: string) {
    super(message ?? 'Requested hashes not found in database')
  }
}

export class HashDidNotMatchError extends ApplicationError {
  constructor(message?: string) {
    super(message ?? 'Responses did not match hashed values')
  }
}
