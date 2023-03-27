import { ApplicationError } from '../core/core.errors'

export class SubmissionNotFoundError extends ApplicationError {
  constructor(message = 'Payment submission not found') {
    super(message)
  }
}

export class SubmissionAndFormMismatchError extends ApplicationError {
  constructor(
    message = 'Submission id provided does not match the one linked to the form id',
  ) {
    super(message)
  }
}

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

export class StripeMetadataPaymentIdNotFoundError extends ApplicationError {
  constructor(message = 'Payment id not found in Stripe metadata') {
    super(message)
  }
}

export class StripeMetadataPaymentIdInvalidError extends ApplicationError {
  constructor(message = 'Invalid payment id found in Stripe metadata') {
    super(message)
  }
}

export class ComputePaymentStateError extends ApplicationError {
  constructor(message = 'Error while computing payment state') {
    super(message)
  }
}
