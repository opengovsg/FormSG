import { ApplicationError } from '../core/core.errors'

export class InvalidDomainError extends ApplicationError {
  constructor(
    message = 'This is not a whitelisted public service email domain. Please log in with your official government or government-linked email address.',
  ) {
    super(message)
  }
}

export class InvalidOtpError extends ApplicationError {
  constructor(message = 'OTP has expired. Please request for a new OTP.') {
    super(message)
  }
}

export class InvalidTokenError extends ApplicationError {
  constructor(message = 'Invalid API Key') {
    super(message)
  }
}

export class MissingTokenError extends ApplicationError {
  constructor(message = "User's API Key not found") {
    super(message)
  }
}
