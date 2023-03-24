import { ApplicationError } from '../core/core.errors'

export class PaymentNotFoundError extends ApplicationError {
  constructor(message = 'Payment not found') {
    super(message)
  }
}

export class PaymentAlreadyConfirmedError extends ApplicationError {
  constructor(message = 'Payment has already been confirmed') {
    super(message)
  }
}
