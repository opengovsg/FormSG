// Use 'stripe-event-types' for better type discrimination.
/// <reference types="stripe-event-types" />

import get from 'lodash/get'
import mongoose from 'mongoose'
import { err, Ok, ok, Result } from 'neverthrow'
import Stripe from 'stripe'

import { Payment, PaymentStatus } from '../../../../shared/types'
import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'

import {
  ComputePaymentStateError,
  StripeMetadataValidPaymentIdNotFoundError,
} from './stripe.errors'

const logger = createLoggerWithLabel(module)

export const getRedirectUri = () =>
  `${
    config.isDev ? 'http://localhost:5001' : config.app.appUrl
  }/api/v3/payments/stripe/callback`

/**
 * Extracts the payment id from the metadata field of objects expected to have
 * it (i.e. payment intents and charges).
 * @param {Stripe.Metadata} metadata the metadata object which is expected to have a payment id
 * @returns ok(paymentId) the extracted paymentId
 * @returns err(StripeMetadataValidPaymentIdNotFoundError) if the payment id was not found or is an invalid BSON object id
 */
export const getMetadataPaymentId = (
  metadata: Stripe.Metadata,
): Result<string, StripeMetadataValidPaymentIdNotFoundError> => {
  const logMeta = {
    action: 'getMetadataPaymentId',
    metadata,
  }
  const paymentId = get(metadata, 'paymentId') // TODO: Extract this value to a constant?
  if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId)) {
    logger.warn({
      message: 'Got metadata with invalid paymentId',
      meta: { ...logMeta, metadata },
    })
    return err(new StripeMetadataValidPaymentIdNotFoundError())
  }
  return ok(paymentId)
}

/**
 * State machine that computes the state of the payment, given the list of
 * Stripe events received via webhooks for this submission.
 * @param {Stripe.Event[]} events the list of Stripe events for state to be computed on
 * @returns ok({status, chargeIdLatest}) status and latest charge id based on the list of events
 * @returns err(ComputePaymentStateError) if there is an error in computing the state
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
  let status: Payment['status'] | null = PaymentStatus.Pending
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
          (event.type === 'charge.dispute.funds_withdrawn' ||
            event.type === 'charge.dispute.updated' ||
            event.type === 'charge.dispute.closed' ||
            event.type === 'charge.dispute.funds_reinstated') &&
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
      default:
        // status is null, so do nothing - null is a sink state
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
    case 'charge.dispute.funds_reinstated':
    case 'charge.dispute.closed':
      return ok({
        status: PaymentStatus.Disputed,
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

/**
 * Computes the state of the payout, given the list of Stripe events received
 * via webhooks for this payment.
 * @param {Stripe.Event[]} events the list of Stripe events for payout state to be computed on
 * @returns ok(payout) payout based on the list of events
 */
export const computePayoutDetails = (
  events: Stripe.Event[],
): Ok<Payment['payout'], never> => {
  const payoutEvents = events.filter(
    (event): event is Stripe.DiscriminatedEvent.PayoutEvent =>
      event.type.startsWith('payout.'),
  )

  let payout

  for (const event of payoutEvents) {
    switch (event.type) {
      case 'payout.created':
        // Once created, we know it will happen, so update the payout
        payout = {
          payoutId: event.data.object.id,
          payoutDate: new Date(event.data.object.arrival_date),
        }
        break
      case 'payout.canceled':
      case 'payout.failed':
        // If it failed or cancelled, clear the payout details
        payout = undefined
        break
      default:
        // Do nothing
        break
    }
  }

  return ok(payout)
}
