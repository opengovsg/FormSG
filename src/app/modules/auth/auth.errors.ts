import { StatusCodes } from 'http-status-codes'

import { ApplicationError } from '../core/core.errors'

export class InvalidDomainError extends ApplicationError {
  constructor(
    message: string = 'This is not a whitelisted public service email domain. Please log in with your official government or government-linked email address.',
  ) {
    super(message, StatusCodes.UNAUTHORIZED)
  }
}

export class InvalidOtpError extends ApplicationError {
  constructor(
    message: string = 'OTP has expired. Please request for a new OTP.',
  ) {
    super(message, StatusCodes.UNPROCESSABLE_ENTITY)
  }
}
