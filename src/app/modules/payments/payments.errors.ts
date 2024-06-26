import { ApplicationError, ErrorCodes } from '../core/core.errors'

export class InvalidPaymentAmountError extends ApplicationError {
  constructor(message = 'Invalid payment amount') {
    super(message, undefined, ErrorCodes.InvalidPaymentAmount)
  }
}

export class PaymentNotFoundError extends ApplicationError {
  constructor(message = 'Payment not found') {
    super(message, undefined, ErrorCodes.PaymentNotFound)
  }
}

export class ConfirmedPaymentNotFoundError extends ApplicationError {
  constructor(message = 'Confirmed payment not found') {
    super(message, undefined, ErrorCodes.ConfirmedPaymentNotFound)
  }
}

export class PaymentAlreadyConfirmedError extends ApplicationError {
  constructor(message = 'Payment has already been confirmed') {
    super(message, undefined, ErrorCodes.PaymentAlreadyConfirmed)
  }
}

export class PaymentAccountInformationError extends ApplicationError {
  constructor(message = 'Missing payment account information') {
    super(message, undefined, ErrorCodes.PaymentAccountInformation)
  }
}

export class InvalidPaymentProductsError extends ApplicationError {
  constructor(message = 'Invalid payment submission') {
    super(message, undefined, ErrorCodes.InvalidPaymentProducts)
  }
}

// TODO: Should remove once email notifications for payment forms are supported
export class PaymentConfigurationError extends ApplicationError {
  constructor(message = 'Invalid payment configuration') {
    super(message, undefined, ErrorCodes.PaymentConfiguration)
  }
}
