// Use 'stripe-event-types' for better type discrimination.
/// <reference types="stripe-event-types" />

import Stripe from 'stripe'

import { Payment, PaymentStatus } from '../../../../shared/types'
import config from '../../config/config'

export const getRedirectUri = () =>
  `${
    config.isDev ? 'http://localhost:5001' : config.app.appUrl
  }/api/v3/payments/stripe/callback`

export const computePaymentState = (
  events: Stripe.Event[],
): Pick<Payment, 'status' | 'chargeIdLatest'> => {
  // Helper to get the charge id from a nested charge object.
  const getChargeId = (charge: string | Stripe.Charge): string =>
    typeof charge === 'string' ? charge : charge.id

  // State machine for computing the current value of the payment state.
  const state = {
    status: PaymentStatus.Pending,
    chargeIdLatest: '',
  }
  for (const event of events as Stripe.DiscriminatedEvent[]) {
    // We only care about charge events for computing payment status
    if (!event.type.startsWith('charge.')) continue

    switch (state.status) {
      case PaymentStatus.Pending:
      case PaymentStatus.Failed:
        if (event.type === 'charge.failed') {
          state.status = PaymentStatus.Failed
          state.chargeIdLatest = event.data.object.id
        } else if (event.type === 'charge.succeeded') {
          state.status = PaymentStatus.Succeeded
          state.chargeIdLatest = event.data.object.id
        } else {
          state.status = PaymentStatus.Unknown
        }
        break
      // Once the payment is successful, ensure that all future events are
      // related to the latest charge. Otherwise, the status should be in an
      // unknown state.
      case PaymentStatus.Succeeded:
      case PaymentStatus.PartiallyRefunded:
        if (
          event.type === 'charge.refunded' &&
          event.data.object.id === state.chargeIdLatest
        ) {
          state.status =
            event.data.object.amount_captured ===
            event.data.object.amount_refunded
              ? PaymentStatus.FullyRefunded
              : PaymentStatus.PartiallyRefunded
        } else if (
          event.type === 'charge.dispute.created' &&
          getChargeId(event.data.object.charge) === state.chargeIdLatest
        ) {
          state.status = PaymentStatus.Disputed
        } else {
          state.status = PaymentStatus.Unknown
        }
        break
      case PaymentStatus.Disputed:
        if (
          event.type === 'charge.dispute.closed' &&
          getChargeId(event.data.object.charge) === state.chargeIdLatest
        ) {
          state.status = PaymentStatus.DisputeClosed
        } else if (
          (event.type === 'charge.dispute.funds_reinstated' ||
            event.type === 'charge.dispute.funds_withdrawn' ||
            event.type === 'charge.dispute.updated') &&
          getChargeId(event.data.object.charge) === state.chargeIdLatest
        ) {
          // Do nothing to retain identical state here - in the future, we can
          // add more detailed tracking if necessary
        } else {
          state.status = PaymentStatus.Unknown
        }
        break
      case PaymentStatus.FullyRefunded:
      case PaymentStatus.DisputeClosed:
        // If we recieve any more charge events, the status is unknown.
        state.status = PaymentStatus.Unknown
        break
      default: // PaymentStatus.Unknown
        // Do nothing - Unknown is a sink state
        break
    }
  }

  return state
}
