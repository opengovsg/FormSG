// Use 'stripe-event-types' for better type discrimination.
/// <reference types="stripe-event-types" />
import { encode } from 'html-entities'
import { StatusCodes } from 'http-status-codes'
import { JSDOM } from 'jsdom'
import mongoose from 'mongoose'
import { err, Ok, ok, Result } from 'neverthrow'
import Stripe from 'stripe'

import { Payment, PaymentStatus } from '../../../../shared/types'
import { hasProp } from '../../../../shared/utils/has-prop'
import { StripePaymentMetadataDto } from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import { ApplicationError } from '../core/core.errors'
import {
  PendingSubmissionNotFoundError,
  ResponseModeError,
} from '../submission/submission.errors'

import {
  PaymentAccountInformationError,
  PaymentNotFoundError,
} from './payments.errors'
import {
  ComputePaymentStateError,
  StripeFetchError,
  StripeMetadataValidPaymentIdNotFoundError,
} from './stripe.errors'

const logger = createLoggerWithLabel(module)

/**
 * Helper function to get the charge id from a nested charge object.
 */
export const getChargeIdFromNestedCharge = (
  charge: string | Stripe.Charge,
): string => (typeof charge === 'string' ? charge : charge.id)

/**
 * Helper function to typeguard Stripe metadata received from payment intents
 * and charges.
 */
const isStripeMetadata = (
  obj: Stripe.Metadata,
): obj is StripePaymentMetadataDto =>
  hasProp(obj, 'formTitle') &&
  hasProp(obj, 'formId') &&
  hasProp(obj, 'submissionId') &&
  hasProp(obj, 'paymentId') &&
  hasProp(obj, 'paymentContactEmail')

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
  if (
    !isStripeMetadata(metadata) ||
    !mongoose.Types.ObjectId.isValid(metadata.paymentId)
  ) {
    logger.warn({
      message: 'Got metadata with invalid paymentId',
      meta: { ...logMeta, metadata },
    })
    return err(new StripeMetadataValidPaymentIdNotFoundError())
  }
  return ok(metadata.paymentId)
}

/**
 * Type representing the payment status state, used in the state machine for
 * computing the current value of the payment state from an array of charge or
 * charge dispute events.
 */
type PaymentState = {
  // A "null" status represents an unknown state, and should be recovered from.
  status: Payment['status'] | null
  chargeIdLatest: Payment['chargeIdLatest']
}

/**
 * Reducer function representing the state machine transitions for computing
 * the current value of the payment state from an array of events.
 */
const chargeStateReducer = (
  state: PaymentState,
  event:
    | Stripe.DiscriminatedEvent.ChargeEvent
    | Stripe.DiscriminatedEvent.ChargeDisputeEvent,
): PaymentState => {
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
        state.status = null
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
        getChargeIdFromNestedCharge(event.data.object.charge) ===
          state.chargeIdLatest
      ) {
        state.status = PaymentStatus.Disputed
      } else {
        state.status = null
      }
      break
    case PaymentStatus.Disputed:
      if (
        (event.type === 'charge.dispute.funds_withdrawn' ||
          event.type === 'charge.dispute.updated' ||
          event.type === 'charge.dispute.closed' ||
          event.type === 'charge.dispute.funds_reinstated') &&
        getChargeIdFromNestedCharge(event.data.object.charge) ===
          state.chargeIdLatest
      ) {
        // Do nothing to retain identical state here - in the future, we can
        // add more detailed tracking if necessary
      } else {
        state.status = null
      }
      break
    case PaymentStatus.FullyRefunded:
      // If we recieve any more charge events, the status is unknown.
      state.status = null
      break
    default:
      // status is null, so do nothing - null is a sink state
      break
  }
  return state
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
      [
        'charge.failed',
        'charge.pending',
        'charge.refunded',
        'charge.succeeded',
      ].includes(event.type) || event.type.startsWith('charge.dispute.'),
  )

  // Step 1: Run the state machine on the array of charge events.
  const { status, chargeIdLatest } = chargeEvents.reduce(chargeStateReducer, {
    status: PaymentStatus.Pending,
    chargeIdLatest: undefined,
  })

  if (status) return ok({ status, chargeIdLatest })

  logger.warn({
    message: 'Compute payment status machine fell into unknown state',
    meta: logMeta,
  })

  // Step 2: Fallback. If the state transitioned into an unknown null state,
  // take the latest charge event that was received as the current status.
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
        chargeIdLatest: getChargeIdFromNestedCharge(
          lastEvent.data.object.charge,
        ),
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
 * Reducer function representing the state machine transitions for computing
 * the current value of the payout state from an array of payout events.
 */
const payoutStateReducer = (
  payout: Payment['payout'],
  event: Stripe.DiscriminatedEvent.PayoutEvent,
): Payment['payout'] => {
  switch (event.type) {
    case 'payout.created':
      // Once created, we know it will happen, so update the payout
      return {
        payoutId: event.data.object.id,
        payoutDate: new Date(event.data.object.arrival_date * 1000), // Convert to miliseconds from epoch
      }
    case 'payout.canceled':
    case 'payout.failed':
      // If it failed or cancelled, clear the payout details
      return undefined
    default:
      return payout
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
  return ok(payoutEvents.reduce(payoutStateReducer, undefined))
}

export const mapRouteErr = (error: ApplicationError) => {
  switch (error.constructor) {
    case ResponseModeError:
      return {
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
        errorMessage: error.message,
      }
    case PaymentNotFoundError: // fall-through
    case PendingSubmissionNotFoundError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage: error.message,
      }
    case StripeFetchError: // fall-through
    case PaymentAccountInformationError: // fall-through
    default:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: error.message,
      }
  }
}

/**
 * Converts receipt sourced from Stripe into an invoice format
 * @param receiptHtmlSource
 */
export const convertToInvoiceFormat = (
  receiptHtmlSource: string,
  { address, gstRegNo }: { address: string; gstRegNo: string },
) => {
  // handle special characters in addresses
  const ADDRESS = encode(address)
  const GST_REG_NO = encode(gstRegNo)

  const edited = receiptHtmlSource
    .replace(/(<title>.*?)receipt(.*?<\/title>)/, '$1invoice$2')
    .replace(/Receipt from /g, 'Invoice from ')
    .replace(
      /Receipt (#[0-9-]+)/,
      `Invoice $1<br /><br />GST Reg No: ${GST_REG_NO}<br />Address: ${ADDRESS}`,
    )
    .replace(/<br>\(This amount is inclusive of GST\)/, '') // not needed for real description (was added by Amit in his test)
    .replace(
      /<strong>Amount charged<\/strong>/,
      '<strong>Amount charged</strong> <i>(includes GST)</i>',
    )

  const dom = new JSDOM(edited)
  const { document } = dom.window

  // select last 5 tables to remove, n = last index
  /**
   * These are:
   * n-5  [Kept] Horizontal Rule
   * n-4  Browser Copy: Something wrong with the email?...
   * n-3  Divider Small
   * n-2  Legal Copy: You're receiving this email because you made a purchase at XXX, which partners with Stripe...
   * n-1  Divider Small
   * n    Divider
   */
  const tables = document.querySelectorAll('table table table')

  let toRemove = 5
  while (toRemove--) {
    tables[tables.length - toRemove - 1].remove()
  }
  return dom.serialize()
}
