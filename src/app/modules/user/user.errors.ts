import { StatusCodes } from 'http-status-codes'

import { ApplicationError } from '../core/core.errors'

export class InvalidOtpError extends ApplicationError {
  constructor(message: string, meta?: string) {
    super(message, StatusCodes.UNPROCESSABLE_ENTITY, meta)
  }
}

export class MalformedOtpError extends ApplicationError {
  constructor(
    message = 'Malformed OTP. Please try again later. If the problem persists, contact us.',
    meta?: string,
  ) {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR, meta)
  }
}

export class MissingUserError extends ApplicationError {
  constructor(message = 'User not found') {
    super(message, StatusCodes.BAD_REQUEST)
  }
}
