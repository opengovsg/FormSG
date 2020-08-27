import HttpStatus from 'http-status-codes'

import { ApplicationError } from '../core/core.errors'

export class ConflictError extends ApplicationError {
  constructor(message: string, meta?: string) {
    super(message, HttpStatus.CONFLICT, meta)
  }
}
