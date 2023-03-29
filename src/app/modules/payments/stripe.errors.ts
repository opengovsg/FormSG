import { ApplicationError } from '../core/core.errors'

export class SuccessfulChargeNotFoundError extends ApplicationError {
  constructor(message = 'Successful charge not found from Stripe API') {
    super(message)
  }
}

export class StripeTransactionFeeNotFoundError extends ApplicationError {
  constructor(message = 'Transaction fee not found from Stripe API') {
    super(message)
  }
}

export class MalformedStripeChargeObjectError extends ApplicationError {
  constructor(message = 'Data missing from charge object') {
    super(message)
  }
}

export class StripeMetadataValidPaymentIdNotFoundError extends ApplicationError {
  constructor(message = 'Valid payment id not found in Stripe metadata') {
    super(message)
  }
}

export class StripeFetchError extends ApplicationError {
  constructor(message = 'Error while requesting Stripe data') {
    super(message)
  }
}

export class StripeAccountError extends ApplicationError {
  constructor(message = 'Error when processing Stripe account') {
    super(message)
  }
}

export class StripeAccountNotFoundError extends ApplicationError {
  constructor(message = 'Stripe account not found') {
    super(message)
  }
}

export class ComputePaymentStateError extends ApplicationError {
  constructor(message = 'Error while computing payment state') {
    super(message)
  }
}
