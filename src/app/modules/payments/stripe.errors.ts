import { ApplicationError } from '../core/core.errors'

export class SubmissionAndFormMismatchError extends ApplicationError {
  constructor(
    message = 'Submission id provided does not match the one linked to the form id',
  ) {
    super(message)
  }
}

export class ChargeReceiptNotFoundError extends ApplicationError {
  constructor(
    message = "Charge object's receipt url not found from Stripe API",
  ) {
    super(message)
  }
}
export class PaymentIntentLatestChargeNotFoundError extends ApplicationError {
  constructor(
    message = "Payment intent's latest charge not found from Stripe API",
  ) {
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

export class EventMetadataSubmissionIdNotFoundError extends ApplicationError {
  constructor(message = 'Submission id not found in event metadata') {
    super(message)
  }
}

export class EventMetadataSubmissionIdInvalidError extends ApplicationError {
  constructor(message = 'Invalid submission id found in event metadata') {
    super(message)
  }
}
