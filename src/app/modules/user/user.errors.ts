import { StatusCodes } from 'http-status-codes'

import { ApplicationError } from '../core/core.errors'

export class InvalidOtpError extends ApplicationError {
  constructor(message: string, meta?: string) {
    super(message, StatusCodes.UNPROCESSABLE_ENTITY, meta)
  }
}

export class MissingUserError extends ApplicationError {
  constructor(message = 'User not found') {
    super(message, StatusCodes.BAD_REQUEST)
  }
}
