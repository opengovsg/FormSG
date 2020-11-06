import { ApplicationError } from '../../modules/core/core.errors'

export class CircuitBreakerError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}

export class FetchMyInfoError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}

export class MyInfoHashError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}
