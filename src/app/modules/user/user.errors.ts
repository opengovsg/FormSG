import HttpStatus from 'http-status-codes'

import { ApplicationError } from '../core/core.errors'

export class InvalidOtpError extends ApplicationError {
  constructor(message: string, meta?: string) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, meta)
  }
}

export class MalformedOtpError extends ApplicationError {
  constructor(
    message: string = 'Malformed OTP. Please try again later. If the problem persists, contact us.',
    meta?: string,
  ) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, meta)
  }
}
