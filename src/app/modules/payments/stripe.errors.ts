import { ApplicationError } from '../core/core.errors'

export class SubmissionNotFoundError extends ApplicationError {
  constructor(message = 'Payment submission not found') {
    super(message)
  }
}

export class PaymentNotFoundError extends ApplicationError {
  constructor(message = 'Payment not found') {
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
