// Use 'stripe-event-types' for better type discrimination.
/// <reference types="stripe-event-types" />
import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'
import get from 'lodash/get'
import mongoose from 'mongoose'
import { errAsync, ok, okAsync, Result } from 'neverthrow'
import Stripe from 'stripe'

import { ErrorDto } from '../../../../shared/types'
import { paymentConfig } from '../../config/features/payment.config'
import { createLoggerWithLabel } from '../../config/logger'
import { stripe } from '../../loaders/stripe'
import getPaymentModel from '../../models/payment.server.model'
import { ControllerHandler } from '../core/core.types'

import * as PaymentService from './payments.service'
import { StripeMetadataIncorrectEnvError } from './stripe.errors'
import * as StripeService from './stripe.service'
import {
  getChargeIdFromNestedCharge,
  getMetadataPaymentId,
  mapRouteError,
} from './stripe.utils'

const logger = createLoggerWithLabel(module)
const PaymentModel = getPaymentModel(mongoose)
/**
 * Middleware which validates that a request came from Stripe webhook by
 * checking the presence of Stripe-Signature in request header
 */
const validateStripeEvent = celebrate({
  [Segments.HEADERS]: Joi.object({
    'stripe-signature': Joi.string().required(),
  }).unknown(),
})

/**
 * Handler for GET /api/v3/notifications/stripe
 * Receives Stripe webhooks and updates the database with transaction details.
 *
 * @returns 200 if webhook is successfully processed
 * @returns 202 if webhooks is not meant for this environment and will be processed by another environment
 * @returns 400 if the Stripe-Signature header is missing or invalid, or the event is malformed
 * @returns 404 if the payment or submission linked to the event cannot be found
 * @returns 422 if any errors occurs in processing the webhook or saving payment to DB
 * @returns 500 if any unexpected errors occur
 */
const _handleStripeEventUpdates: ControllerHandler<
  unknown,
  void | ErrorDto,
  string
> = async (req, res) => {
  // Step 1: Verify the payload and ensure that it is indeed sent from Stripe.
  // See https://stripe.com/docs/webhooks/signatures

  const sig = req.headers['stripe-signature']
  if (!sig) return res.sendStatus(StatusCodes.BAD_REQUEST)

  // Needed to obtain the raw body from the request. Set in the parser middlewares
  const rawBody = get(req, 'rawBody') as unknown as string

  let event: Stripe.DiscriminatedEvent
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      paymentConfig.stripeWebhookSecret,
    ) as Stripe.DiscriminatedEvent
  } catch (e) {
    // Throws Stripe.errors.StripeSignatureVerificationError
    logger.error({
      message: 'Received invalid request from Stripe webhook endpoint',
      meta: {
        action: 'handleStripeEventUpdates',
        req: req.body,
        error: e,
      },
    })
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }

  // Step 2: Received event, proceed to process it.

  const logMeta = {
    action: 'handleStripeEventUpdates',
    event,
  }

  logger.info({
    message: 'Received Stripe event from webhook',
    meta: logMeta,
  })

  let result: Result<void, any> = ok(undefined)

  switch (event.type) {
    // We catch all payment_intent, charge and payout events, except the
    // following ignored event types (as associated features are not supported):
    // - charge.captured, charge.expired (only for capture flow)
    // - charge.updated (descriptions or metadata are updated)
    // - payment_intent.amount_capturable_updated (only for capture flow)
    // - payment_intent.partially_funded (only occurs when payment intents are
    //   completed in part by customer stripe account balance)
    case 'payment_intent.canceled':
    case 'payment_intent.created':
    case 'payment_intent.payment_failed':
    case 'payment_intent.processing':
    case 'payment_intent.requires_action':
    case 'payment_intent.succeeded':
    case 'charge.failed':
    case 'charge.pending':
    case 'charge.refunded':
    case 'charge.succeeded': {
      result = await getMetadataPaymentId(
        event.data.object.metadata,
      ).asyncAndThen((paymentId) =>
        StripeService.processStripeEvent(paymentId, event).andThen(() => {
          if (event.type !== 'charge.succeeded') return okAsync(undefined)

          return PaymentService.performPaymentPostSubmissionActions(paymentId)
            .andThen(() => okAsync(undefined))
            .orElse((e) => {
              logger.warn({
                message: 'Payment confirmation email not sent',
                meta: logMeta,
              })
              return errAsync(e)
            })
        }),
      )
      break
    }
    case 'charge.dispute.closed':
    case 'charge.dispute.created':
    case 'charge.dispute.funds_reinstated':
    case 'charge.dispute.funds_withdrawn':
    case 'charge.dispute.updated': {
      const chargeIdLatest = getChargeIdFromNestedCharge(
        event.data.object.charge,
      )

      const payment = await PaymentModel.findOne({ chargeIdLatest })
      if (!payment) {
        logger.warn({
          message: 'Received dispute event with unknown latest charge id',
          meta: { ...logMeta, chargeIdLatest },
        })
        return res.sendStatus(StatusCodes.BAD_REQUEST)
      }

      result = await StripeService.processStripeEvent(payment.id, event)
      break
    }
    case 'charge.refund.updated': {
      if (!event.data.object.charge) {
        logger.warn({
          message: 'Received Stripe event charge.refund.updated with no charge',
          meta: { ...logMeta, chargeIdLatest: event.data.object.charge },
        })
        return res.sendStatus(StatusCodes.BAD_REQUEST)
      }

      const chargeIdLatest = getChargeIdFromNestedCharge(
        event.data.object.charge,
      )

      const payment = await PaymentModel.findOne({ chargeIdLatest })
      if (!payment) {
        logger.warn({
          message:
            'Received refund updated event with unknown latest charge id',
          meta: { ...logMeta, chargeIdLatest },
        })
        return res.sendStatus(StatusCodes.BAD_REQUEST)
      }

      result = await StripeService.processStripeEvent(payment.id, event)
      break
    }
    case 'payout.canceled':
    case 'payout.created':
    case 'payout.failed':
    case 'payout.paid':
    case 'payout.updated':
    case 'payout.reconciliation_completed': {
      // Retrieve the list of balance transactions related to this payout, and
      // associate the payout with the set of charges it pays out for
      await stripe.balanceTransactions
        .list(
          { payout: event.data.object.id, expand: ['data.source'] },
          { stripeAccount: event.account },
        )
        .autoPagingEach(async (balanceTransaction) => {
          if (balanceTransaction.type !== 'charge') return

          const charge = balanceTransaction.source as Stripe.Charge
          const innerResult = await getMetadataPaymentId(
            charge.metadata,
          ).asyncAndThen((paymentId) =>
            StripeService.processStripeEvent(paymentId, event),
          )

          // Reducer to keep errors around
          result = result.isOk() ? innerResult : result
        })

      break
    }
    default:
      // Ignore all other events
      logger.warn({
        message: 'Received Stripe event from webhook with unknown event.type',
        meta: logMeta,
      })
      break
  }

  // Step 4: Return response to Stripe based on result
  result.match(
    () => res.sendStatus(StatusCodes.OK),
    (error) => {
      if (error instanceof StripeMetadataIncorrectEnvError) {
        // Intercept this error and return 202 Accepted instead, indicating
        // the request will be processed by another environment server.
        return res.sendStatus(StatusCodes.ACCEPTED)
      }
      // Additional logging with error details
      logger.error({
        message: 'Error thrown in webhook handler',
        meta: logMeta,
        error,
      })
      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    },
  )
}

export const handleStripeEventUpdates = [
  validateStripeEvent,
  _handleStripeEventUpdates,
]
