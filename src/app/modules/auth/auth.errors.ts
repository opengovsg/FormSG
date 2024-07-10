import { ApplicationError, ErrorCodes } from '../core/core.errors'

export class InvalidDomainError extends ApplicationError {
  constructor(
    message = 'This is not a whitelisted public service email domain. Please log in with your official government or government-linked email address.',
  ) {
    super(message, undefined, ErrorCodes.AUTH_INVALID_DOMAIN)
  }
}

export class InvalidOtpError extends ApplicationError {
  constructor(message = 'OTP has expired. Please request for a new OTP.') {
    super(message, undefined, ErrorCodes.AUTH_INVALID_OTP)
  }
}

export class InvalidTokenError extends ApplicationError {
  constructor(message = 'Invalid API Key') {
    super(message, undefined, ErrorCodes.AUTH_INVALID_TOKEN)
  }
}

export class MissingTokenError extends ApplicationError {
  constructor(message = "User's API Key not found") {
    super(message, undefined, ErrorCodes.AUTH_MISSING_TOKEN)
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message = 'User is unauthorized.') {
    super(message, undefined, ErrorCodes.AUTH_UNAUTHORIZED)
  }
}
