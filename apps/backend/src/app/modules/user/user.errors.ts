import { ApplicationError, ErrorCodes } from '../core/core.errors'

export class InvalidOtpError extends ApplicationError {
  constructor(message: string) {
    super(message, undefined, ErrorCodes.USER_INVALID_OTP)
  }
}

export class MissingUserError extends ApplicationError {
  constructor(message = 'User not found') {
    super(message, undefined, ErrorCodes.USER_MISSING)
  }
}
