import HttpStatus from 'http-status-codes'

import { ApplicationError } from '../core/core.errors'

export class WebhookValidationError extends ApplicationError {
  constructor(message: string, meta?: string) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, meta)
  }
}
