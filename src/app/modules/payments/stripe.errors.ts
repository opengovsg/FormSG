import { ApplicationError, ErrorCodes } from '../core/core.errors'

export class SuccessfulChargeNotFoundError extends ApplicationError {
  constructor(message = 'Successful charge not found from Stripe API') {
    super(
      message,
      undefined,
      ErrorCodes.PAYMENT_STRIPE_SUCCESSFUL_CHARGE_NOT_FOUND,
    )
  }
}

export class StripeTransactionFeeNotFoundError extends ApplicationError {
  constructor(message = 'Transaction fee not found from Stripe API') {
    super(
      message,
      undefined,
      ErrorCodes.PAYMENT_STRIPE_TRANSACTION_FEE_NOT_FOUND,
    )
  }
}

export class MalformedStripeChargeObjectError extends ApplicationError {
  constructor(message = 'Data missing from charge object') {
    super(message, undefined, ErrorCodes.PAYMENT_STRIPE_MALFORMED_CHARGE_OBJECT)
  }
}

export class MalformedStripeEventObjectError extends ApplicationError {
  constructor(message = 'Data missing from event object') {
    super(message, undefined, ErrorCodes.PAYMENT_STRIPE_MALFORMED_EVENT_OBJECT)
  }
}

export class StripeMetadataInvalidError extends ApplicationError {
  constructor(message = 'Invalid shape found for Stripe metadata') {
    super(message, undefined, ErrorCodes.PAYMENT_STRIPE_METADATA_INVALID)
  }
}

export class StripeMetadataValidPaymentIdNotFoundError extends ApplicationError {
  constructor(message = 'Valid payment id not found in Stripe metadata') {
    super(
      message,
      undefined,
      ErrorCodes.PAYMENT_STRIPE_METADATA_VALID_PAYMENT_ID_NOT_FOUND,
    )
  }
}

export class StripeMetadataIncorrectEnvError extends ApplicationError {
  constructor(message = 'Stripe webhook sent to incorrect application') {
    super(message, undefined, ErrorCodes.PAYMENT_STRIPE_METADATA_INCORRECT_ENV)
  }
}

export class StripeFetchError extends ApplicationError {
  constructor(message = 'Error while requesting Stripe data') {
    super(message, undefined, ErrorCodes.PAYMENT_STRIPE_FETCH_ERROR)
  }
}

export class StripeAccountError extends ApplicationError {
  constructor(message = 'Error when processing Stripe account') {
    super(message, undefined, ErrorCodes.PAYMENT_STRIPE_ACCOUNT_ERROR)
  }
}

export class ComputePaymentStateError extends ApplicationError {
  constructor(message = 'Error while computing payment state') {
    super(message, undefined, ErrorCodes.PAYMENT_STRIPE_COMPUTE_PAYMENT_STATE)
  }
}
