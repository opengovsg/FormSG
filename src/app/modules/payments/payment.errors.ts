import { ApplicationError } from '../core/core.errors'

export class PaymentNotFoundError extends ApplicationError {
  constructor(message = 'Payment not found') {
    super(message)
  }
}

export class InvalidPaymentAmountError extends ApplicationError {
  constructor(message = 'Invalid payment amount') {
    super(message)
  }
}