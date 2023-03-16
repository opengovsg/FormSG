import { ApplicationError } from '../core/core.errors'

export class PaymentNotFoundError extends ApplicationError {
  constructor(message = 'Payment not found') {
    super(message)
  }
}
export class PaymentReceiptNotAvailableYet extends ApplicationError {
  constructor(message = 'Payment receipt not available yet') {
    super(message)
  }
}
