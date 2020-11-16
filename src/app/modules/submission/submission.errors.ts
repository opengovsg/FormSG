import { StatusCodes } from 'http-status-codes'

import { ApplicationError } from '../core/core.errors'

/**
 * A custom error class thrown by the submission controllers
 * when some form fields are missing from the submission
 */
export class ConflictError extends ApplicationError {
  constructor(message: string, meta?: string) {
    super(message, StatusCodes.CONFLICT, meta)
  }
}

export class SubmissionNotFoundError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}
