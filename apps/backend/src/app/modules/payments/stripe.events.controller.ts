// Use 'stripe-event-types' for better type discrimination.
/// <reference types="stripe-event-types" />
import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'
import get from 'lodash/get'
import Stripe from 'stripe'

import { ErrorDto } from '../../../../shared/types'
import { paymentConfig } from '../../config/features/payment.config'
import { createLoggerWithLabel } from '../../config/logger'
import { stripe } from '../../loaders/stripe'
import { ControllerHandler } from '../core/core.types'

import {
  StripeMetadataIncorrectEnvError,
  StripeMetadataInvalidError,
} from './stripe.errors'
import * as StripeService from './stripe.service'
import { mapRouteError } from './stripe.utils'

const logger = createLoggerWithLabel(module)

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

  // Step 3: Process the event
  return (
    StripeService.handleStripeEvent(event)
      // Step 4: Return response to Stripe based on result
      .match(
        () => res.sendStatus(StatusCodes.OK),
        (error) => {
          if (
            error instanceof StripeMetadataIncorrectEnvError ||
            error instanceof StripeMetadataInvalidError
          ) {
            // Intercept these errors and return 202 Accepted instead.
            // StripeMetadataIncorrectEnvError: the request will be processed by another environment server.
            // StripeMetadataInvalidError: Agencies are using the Stripe account to process payments outside of FormSG.
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
  )
}

export const handleStripeEventUpdates = [
  validateStripeEvent,
  _handleStripeEventUpdates,
]
