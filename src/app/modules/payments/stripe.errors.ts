import { ApplicationError, ErrorCodes } from '../core/core.errors'

export class SuccessfulChargeNotFoundError extends ApplicationError {
  constructor(message = 'Successful charge not found from Stripe API') {
    super(message, undefined, ErrorCodes.SuccessfulChargeNotFound)
  }
}

export class StripeTransactionFeeNotFoundError extends ApplicationError {
  constructor(message = 'Transaction fee not found from Stripe API') {
    super(message, undefined, ErrorCodes.StripeTransactionFeeNotFound)
  }
}

export class MalformedStripeChargeObjectError extends ApplicationError {
  constructor(message = 'Data missing from charge object') {
    super(message, undefined, ErrorCodes.MalformedStripeChargeObject)
  }
}

export class MalformedStripeEventObjectError extends ApplicationError {
  constructor(message = 'Data missing from event object') {
    super(message, undefined, ErrorCodes.MalformedStripeEventObject)
  }
}

export class StripeMetadataInvalidError extends ApplicationError {
  constructor(message = 'Invalid shape found for Stripe metadata') {
    super(message, undefined, ErrorCodes.StripeMetadataInvalid)
  }
}

export class StripeMetadataValidPaymentIdNotFoundError extends ApplicationError {
  constructor(message = 'Valid payment id not found in Stripe metadata') {
    super(message, undefined, ErrorCodes.StripeMetadataValidPaymentIdNotFound)
  }
}

export class StripeMetadataIncorrectEnvError extends ApplicationError {
  constructor(message = 'Stripe webhook sent to incorrect application') {
    super(message, undefined, ErrorCodes.StripeMetadataIncorrectEnv)
  }
}

export class StripeFetchError extends ApplicationError {
  constructor(message = 'Error while requesting Stripe data') {
    super(message, undefined, ErrorCodes.StripeFetch)
  }
}

export class StripeAccountError extends ApplicationError {
  constructor(message = 'Error when processing Stripe account') {
    super(message, undefined, ErrorCodes.StripeAccount)
  }
}

export class ComputePaymentStateError extends ApplicationError {
  constructor(message = 'Error while computing payment state') {
    super(message, undefined, ErrorCodes.ComputePaymentState)
  }
}
