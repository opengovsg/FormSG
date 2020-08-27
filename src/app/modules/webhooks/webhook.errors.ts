import HttpStatus from 'http-status-codes'

import { ApplicationError } from '../core/core.errors'

/**
 * A custom error class thrown by the webhook server controller
 * if the submissionWebhookView is null or the webhookUrl is an invalid URL
 */
export class WebhookValidationError extends ApplicationError {
  constructor(message: string, meta?: string) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, meta)
  }
}
