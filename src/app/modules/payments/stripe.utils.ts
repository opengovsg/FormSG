// Use 'stripe-event-types' for better type discrimination.
/// <reference types="stripe-event-types" />

import { err, ok, Result } from 'neverthrow'
import Stripe from 'stripe'

import { createLoggerWithLabel } from 'src/app/config/logger'

import { Payment, PaymentStatus } from '../../../../shared/types'
import config from '../../config/config'

import { ComputePaymentStateError } from './stripe.errors'

const logger = createLoggerWithLabel(module)

export const getRedirectUri = () =>
  `${
    config.isDev ? 'http://localhost:5001' : config.app.appUrl
  }/api/v3/payments/stripe/callback`

/**
 * State machine that computes the state of the payment, given the list of
 * Stripe events received via webhooks for this submission.
 * @param events the list of Stripe events for state to be computed on
 * @returns neverthrow ok() status and latest charge id based on the list of events
 * @returns neverthrow err(ComputePaymentStateError) if there is an error in computing the state
 */
export const computePaymentState = (
  events: Stripe.Event[],
): Result<
  Pick<Payment, 'status' | 'chargeIdLatest'>,
  ComputePaymentStateError
> => {
  const logMeta = {
    action: 'computePaymentState',
    events,
  }

  // Helper to get the charge id from a nested charge object.
  const getChargeId = (charge: string | Stripe.Charge): string =>
    typeof charge === 'string' ? charge : charge.id

  // We only care about charge and dispute events for computing payment status.
  // The event types are:
  // - charge.(failed|pending|refunded|succeeded)
  // - charge.dispute.(closed|created|funds_reinstated|funds_withdrawn|updated)
  const chargeEvents = (events as Stripe.DiscriminatedEvent[]).filter(
    (
      event: Stripe.DiscriminatedEvent,
    ): event is
      | Stripe.DiscriminatedEvent.ChargeEvent
      | Stripe.DiscriminatedEvent.ChargeDisputeEvent =>
      event.type === 'charge.failed' ||
      event.type === 'charge.pending' ||
      event.type === 'charge.refunded' ||
      event.type === 'charge.succeeded' ||
      event.type.startsWith('charge.dispute.'),
  )

  // Step 1: State machine for computing the current value of the payment state.
  // A "null" status represents an unknown state, and should be recovered from later.
  let status: PaymentStatus | null = PaymentStatus.Pending
  let chargeIdLatest: Payment['chargeIdLatest']

  for (const event of chargeEvents) {
    switch (status) {
      case PaymentStatus.Pending:
      case PaymentStatus.Failed:
        if (event.type === 'charge.failed') {
          status = PaymentStatus.Failed
          chargeIdLatest = event.data.object.id
        } else if (event.type === 'charge.succeeded') {
          status = PaymentStatus.Succeeded
          chargeIdLatest = event.data.object.id
        } else {
          status = null
        }
        break
      // Once the payment is successful, ensure that all future events are
      // related to the latest charge. Otherwise, the status should be in an
      // unknown state.
      case PaymentStatus.Succeeded:
      case PaymentStatus.PartiallyRefunded:
        if (
          event.type === 'charge.refunded' &&
          event.data.object.id === chargeIdLatest
        ) {
          status =
            event.data.object.amount_captured ===
            event.data.object.amount_refunded
              ? PaymentStatus.FullyRefunded
              : PaymentStatus.PartiallyRefunded
        } else if (
          event.type === 'charge.dispute.created' &&
          getChargeId(event.data.object.charge) === chargeIdLatest
        ) {
          status = PaymentStatus.Disputed
        } else {
          status = null
        }
        break
      case PaymentStatus.Disputed:
        if (
          event.type === 'charge.dispute.closed' &&
          getChargeId(event.data.object.charge) === chargeIdLatest
        ) {
          status = PaymentStatus.DisputeClosed
        } else if (
          (event.type === 'charge.dispute.funds_withdrawn' ||
            event.type === 'charge.dispute.updated') &&
          getChargeId(event.data.object.charge) === chargeIdLatest
        ) {
          // Do nothing to retain identical state here - in the future, we can
          // add more detailed tracking if necessary
        } else {
          status = null
        }
        break
      case PaymentStatus.DisputeClosed:
        if (
          event.type === 'charge.dispute.funds_reinstated' &&
          getChargeId(event.data.object.charge) === chargeIdLatest
        ) {
          // Do nothing to retain identical state here - in the future, we can
          // add more detailed tracking if necessary
        } else {
          status = null
        }
        break
      case PaymentStatus.FullyRefunded:
        // If we recieve any more charge events, the status is unknown.
        status = null
        break
      default: // state.status is null
        // Do nothing - null is a sink state
        break
    }
  }

  if (status) return ok({ status, chargeIdLatest })

  logger.warn({
    message: 'Compute payment status machine fell into unknown state',
    meta: logMeta,
  })

  // Step 2: Fallback. If the state transitioned into an unknown state, take the
  // latest charge event that was received as the current status.
  if (chargeEvents.length === 0) {
    // An empty chargeEvents array should return a pending status, so this
    // should never happen.
    logger.error({
      message: 'Status is unknown even with no charge events',
      meta: logMeta,
    })
    return err(new ComputePaymentStateError())
  }
  const lastEvent = chargeEvents[chargeEvents.length - 1]
  switch (lastEvent.type) {
    case 'charge.failed':
      return ok({
        status: PaymentStatus.Failed,
        chargeIdLatest: lastEvent.data.object.id,
      })
    case 'charge.pending':
      return ok({
        status: PaymentStatus.Pending,
        chargeIdLatest: lastEvent.data.object.id,
      })
    case 'charge.succeeded':
      return ok({
        status: PaymentStatus.Succeeded,
        chargeIdLatest: lastEvent.data.object.id,
      })
    case 'charge.refunded':
      return ok({
        status:
          lastEvent.data.object.amount_captured ===
          lastEvent.data.object.amount_refunded
            ? PaymentStatus.FullyRefunded
            : PaymentStatus.PartiallyRefunded,
        chargeIdLatest: lastEvent.data.object.id,
      })
    case 'charge.dispute.created':
    case 'charge.dispute.updated':
    case 'charge.dispute.funds_withdrawn':
      return ok({
        status: PaymentStatus.Disputed,
        chargeIdLatest: getChargeId(lastEvent.data.object.charge),
      })
    case 'charge.dispute.funds_reinstated':
    case 'charge.dispute.closed':
      return ok({
        status: PaymentStatus.DisputeClosed,
        chargeIdLatest: getChargeId(lastEvent.data.object.charge),
      })
    default:
      // All cases have been covered, so this should never happen.
      logger.error({
        message: 'Encountered unexpected charge event type',
        meta: logMeta,
      })
      return err(new ComputePaymentStateError())
  }
}

export const isPaymentStatusPostSuccess = (status: PaymentStatus) =>
  status === PaymentStatus.Succeeded ||
  status === PaymentStatus.PartiallyRefunded ||
  status === PaymentStatus.FullyRefunded ||
  status === PaymentStatus.Disputed ||
  status === PaymentStatus.DisputeClosed
