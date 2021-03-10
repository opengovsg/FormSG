import { ApplicationError } from '../core/core.errors'

export class InvalidOtpError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}

export class MissingUserError extends ApplicationError {
  constructor(message = 'User not found') {
    super(message)
  }
}
