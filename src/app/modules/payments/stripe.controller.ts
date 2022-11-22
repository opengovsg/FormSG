// Use 'stripe-event-types' for better type discrimination.
/// <reference types="stripe-event-types" />

import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'
import get from 'lodash/get'
import Stripe from 'stripe'

import { Payment, PaymentStatus } from '../../../../shared/types'
import { paymentConfig } from '../../config/features/payment.config'
import { createLoggerWithLabel } from '../../config/logger'
import { stripe } from '../../loaders/stripe'
import { ControllerHandler } from '../core/core.types'

import * as PaymentService from './payments.service'
import * as StripeService from './stripe.service'

const logger = createLoggerWithLabel(module)

/**
 * Middleware which validates that a request came from Stripe webhook
 * by checking the presence of Stripe-Signature in request header
 */
const validateStripeEvent = celebrate({
  [Segments.HEADERS]: Joi.object({
    'stripe-signature': Joi.string().required(),
  }).unknown(),
})

const findPaymentAndUpdate = async (
  metadata: Stripe.Metadata | null,
  update: Partial<Payment>,
  event: Stripe.Event,
): Promise<void> => {
  const submissionId = metadata?.['submissionId']
  if (!submissionId) {
    logger.warn({
      message: 'Stripe event metadata does not contain submissionId',
      meta: {
        action: 'handleStripeEventUpdates',
        event,
      },
    })
    return
  }

  await PaymentService.findBySubmissionIdAndUpdate(submissionId, {
    $set: update,
    $push: { webhookLog: event },
  })
}

const stripeChargeStatusToPaymentStatus = (
  status: Stripe.Charge.Status,
): PaymentStatus => {
  switch (status) {
    case 'failed':
      return PaymentStatus.Failed
    case 'pending':
      return PaymentStatus.Pending
    case 'succeeded':
      return PaymentStatus.Succeeded
  }
}

export const _handleStripeEventUpdates: ControllerHandler<
  unknown,
  never,
  string
> = async (req, res) => {
  // Verify the payload and ensure that it is indeed sent from Stripe.
  // See https://stripe.com/docs/webhooks/signatures
  const sig = req.headers['stripe-signature']
  if (!sig) return res.status(StatusCodes.BAD_REQUEST).send()

  // Needed to obtain the raw body from the request. This is set in the parser, see
  // parserMiddlewares.saveStripeWebhookRawBody in src/app/loaders/express/parser.ts.
  const rawBody = get(req, 'rawBody') as unknown as string

  let event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      paymentConfig.stripeWebhookSecret,
    ) as Stripe.DiscriminatedEvent
  } catch (e) {
    // Throws Stripe.errors.StripeSignatureVerificationError
    logger.info({
      message: 'Received invalid request from Stripe webhook endpoint',
      meta: {
        action: 'handleStripeEventUpdates',
        req: req.body,
        error: e,
      },
    })
    return res.status(StatusCodes.BAD_REQUEST).send()
  }

  logger.info({
    message: 'Received Stripe event from webhook',
    meta: {
      action: 'handleStripeEventUpdates',
      event,
    },
  })

  switch (event.type) {
    case 'charge.captured':
    case 'charge.expired':
    case 'charge.failed':
    case 'charge.pending':
    case 'charge.refunded':
    case 'charge.succeeded':
    case 'charge.updated':
      await findPaymentAndUpdate(
        event.data.object.metadata,
        {
          chargeIdLatest: event.data.object.id,
          status: stripeChargeStatusToPaymentStatus(event.data.object.status),
        },
        event,
      )
      break
    case 'charge.dispute.closed':
    case 'charge.dispute.created':
    case 'charge.dispute.funds_reinstated':
    case 'charge.dispute.funds_withdrawn':
    case 'charge.dispute.updated':
      await findPaymentAndUpdate(event.data.object.metadata, {}, event)
      break
    case 'charge.refund.updated':
      // We should actually handle this case, need to implement based on get by charge Id though, not doing for hackathon.
      break
    case 'payment_intent.amount_capturable_updated':
    case 'payment_intent.canceled':
    case 'payment_intent.created':
    case 'payment_intent.partially_funded':
    case 'payment_intent.payment_failed':
    case 'payment_intent.processing':
    case 'payment_intent.requires_action':
    case 'payment_intent.succeeded':
      await findPaymentAndUpdate(event.data.object.metadata, {}, event)
      break
    case 'payout.canceled':
    case 'payout.created':
    case 'payout.failed':
    case 'payout.paid':
    case 'payout.updated':
      await findPaymentAndUpdate(
        event.data.object.metadata,
        {
          payoutId: event.data.object.id,
          payoutDate: new Date(event.data.object.arrival_date),
        },
        event,
      )
      break
    default:
      // Ignore all other events
      break
  }

  return res.status(StatusCodes.OK).send()
}

export const handleStripeEventUpdates = [
  validateStripeEvent,
  _handleStripeEventUpdates,
]

export const getPaymentReceipt: ControllerHandler<{
  formId: string
  submissionId: string
}> = (req, res) => {
  const { formId, submissionId } = req.params
  logger.info({
    message: 'getPaymentReceipt endpoint called',
    meta: {
      action: 'getPaymentReceipt',
      formId: formId,
      submissionId: submissionId,
    },
  })

  return StripeService.getReceiptURL(formId, submissionId)
    .map((receiptUrl) => {
      logger.info({
        message: 'Received receipt url from Stripe webhook',
        meta: {
          action: 'getPaymentReceipt',
          receiptUrl,
        },
      })
      res.status(StatusCodes.OK).send({ receipt: receiptUrl })
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error retrieving receipt URL',
        meta: {
          action: 'getPaymentReceipt',
          formId: formId,
          submissionId: submissionId,
        },
        error,
      })
      return res.status(StatusCodes.NOT_FOUND).json({ message: error })
    })
}
