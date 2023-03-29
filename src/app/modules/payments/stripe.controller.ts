// Use 'stripe-event-types' for better type discrimination.
/// <reference types="stripe-event-types" />
import axios from 'axios'
import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'
import get from 'lodash/get'
import mongoose from 'mongoose'
import { ok, Result } from 'neverthrow'
import Stripe from 'stripe'

import config from '../../config/config'
import { paymentConfig } from '../../config/features/payment.config'
import { createLoggerWithLabel } from '../../config/logger'
import { stripe } from '../../loaders/stripe'
import getPaymentModel from '../../models/payment.server.model'
import { generatePdfFromHtml } from '../../utils/convert-html-to-pdf'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'
import { retrieveFullFormById } from '../form/form.service'
import { checkFormIsEncryptMode } from '../submission/encrypt-submission/encrypt-submission.service'

import * as PaymentService from './payments.service'
import * as StripeService from './stripe.service'
import { getMetadataPaymentId } from './stripe.utils'

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
 * @returns 400 if the Stripe-Signature header is missing or invalid
 * @returns 500 if any errors occurs in processing the webhook or saving payment to DB
 */
const _handleStripeEventUpdates: ControllerHandler<
  unknown,
  never,
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

  const logMeta = {
    action: 'handleStripeEventUpdates',
    event,
  }

  // Step 2: Received event, proceed to process it.
  logger.info({
    message: 'Received Stripe event from webhook',
    meta: logMeta,
  })

  // Step 3: Get the relevant payment Id

  let result: Result<void, any> = ok(undefined)

  switch (event.type) {
    // Ignore these two charge event types as they are only for capture flow.
    // case 'charge.captured':
    // case 'charge.expired':
    // Ignore this charge event type as it is for when descriptions or metadata
    // are updated (which we will not support).
    // case 'charge.updated':
    case 'payment_intent.amount_capturable_updated':
    case 'payment_intent.canceled':
    case 'payment_intent.created':
    case 'payment_intent.partially_funded':
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
        StripeService.processStripeEvent(paymentId, event),
      )
      break
    }
    case 'charge.dispute.closed':
    case 'charge.dispute.created':
    case 'charge.dispute.funds_reinstated':
    case 'charge.dispute.funds_withdrawn':
    case 'charge.dispute.updated': {
      const chargeIdLatest =
        typeof event.data.object.charge === 'string'
          ? event.data.object.charge
          : event.data.object.charge.id

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
      const chargeIdLatest =
        typeof event.data.object.charge === 'string'
          ? event.data.object.charge
          : event.data.object.charge?.id

      if (!chargeIdLatest) {
        logger.warn({
          message: 'Received Stripe event charge.refund.updated with no charge',
          meta: { ...logMeta, chargeIdLatest },
        })
        return res.sendStatus(StatusCodes.BAD_REQUEST)
      }

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
      const payout = event.data.object.id
      const stripeAccount = event.account
      if (!stripeAccount) {
        logger.warn({
          message: 'Received payout event without event.account attribute',
          meta: { ...logMeta, payout },
        })
        return res.sendStatus(StatusCodes.BAD_REQUEST)
      }

      // Retrieve the list of balance transactions related to this payout, and
      // associate the payout with the set of charges it pays out for
      await stripe.balanceTransactions
        .list({ payout, expand: ['data.source'] }, { stripeAccount })
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
      break
  }

  result.match(
    () => res.sendStatus(StatusCodes.OK),
    (error) => {
      // Additional logging with error details
      logger.error({
        message: 'Error thrown in webhook handler',
        meta: logMeta,
        error,
      })
      return res.sendStatus(StatusCodes.BAD_REQUEST)
    },
  )
}

export const handleStripeEventUpdates = [
  validateStripeEvent,
  _handleStripeEventUpdates,
]

// TODO: Refactor for use in static payment url implementation
export const checkPaymentReceiptStatus: ControllerHandler<{
  formId: string
  submissionId: string
}> = async (req, res) => {
  const { formId, submissionId } = req.params
  logger.info({
    message: 'getPaymentStatus endpoint called',
    meta: {
      action: 'getPaymentStatus',
      formId: formId,
      submissionId: submissionId,
    },
  })

  return PaymentService.findPaymentBySubmissionId(submissionId)
    .map((payment) => {
      logger.info({
        message: 'Received payment object with receipt url from Stripe webhook',
        meta: {
          action: 'checkPaymentReceiptStatus',
          payment,
        },
      })

      return res.status(StatusCodes.OK).json({ isReady: true })
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error retrieving receipt URL',
        meta: {
          action: 'checkPaymentReceiptStatus',
          formId: formId,
          submissionId: submissionId,
        },
        error,
      })
      return res.status(StatusCodes.NOT_FOUND).json({ message: error })
    })
}

// TODO: Refactor for use in static payment url implementation
export const downloadPaymentReceipt: ControllerHandler<{
  formId: string
  submissionId: string
}> = (req, res) => {
  const { formId, submissionId } = req.params
  logger.info({
    message: 'downloadPaymentReceipt endpoint called',
    meta: {
      action: 'downloadPaymentReceipt',
      formId: formId,
      submissionId: submissionId,
    },
  })

  return PaymentService.findPaymentBySubmissionId(submissionId)
    .map((payment) => {
      logger.info({
        message: 'Received receipt url from Stripe webhook',
        meta: {
          action: 'downloadPaymentReceipt',
          payment,
        },
      })
      // retrieve receiptURL as html
      return (
        axios
          .get<string>(payment.completedPayment?.receiptUrl ?? '')
          // convert to pdf and return
          .then((receiptUrlResponse) => {
            const html = receiptUrlResponse.data
            const pdfBufferPromise = generatePdfFromHtml(html)
            return pdfBufferPromise
          })
          .then((pdfBuffer) => {
            res.set({
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename=${submissionId}-receipt.pdf`,
            })
            return res.status(StatusCodes.OK).send(pdfBuffer)
          })
      )
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error retrieving receipt',
        meta: {
          action: 'downloadPaymentReceipt',
          formId: formId,
          submissionId: submissionId,
        },
        error,
      })
      return res.status(StatusCodes.NOT_FOUND).json({ message: error })
    })
}

const _handleConnectOauthCallback: ControllerHandler<
  unknown,
  unknown,
  unknown,
  { code: string; state: string }
> = async (req, res) => {
  const { code, state } = req.query

  //Extracting state parameter previously signed and stored in cookies
  const { stripeState } = req.signedCookies

  //Comparing state parameters
  if (state !== stripeState) {
    //throwing unprocessable entity error
    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      message: 'Invalid state parameter',
    })
  }

  // Step 1: Retrieve formId from state.
  const formId = state.split('.')[0]
  const redirectUrl = `${config.app.appUrl}/admin/form/${formId}/settings`
  // Step 2: Retrieve currently logged in user.
  return (
    retrieveFullFormById(formId)
      .andThen(checkFormIsEncryptMode)
      .andThen((form) =>
        StripeService.exchangeCodeForAccessToken(code).andThen((token) => {
          // Step 4: Store access token in form.
          return StripeService.linkStripeAccountToForm(form, {
            accountId: token.stripe_user_id,
            publishableKey: token.stripe_publishable_key,
          })
        }),
      )
      .map(() => {
        // Step 5: Redirect back to settings page.
        return res.redirect(redirectUrl)
      })
      // Also redirect back to settings page if there is an error.
      .mapErr((error) => {
        logger.error({
          message: 'Error handling stripe oauth callback',
          meta: {
            action: 'handleConnectOauthCallback',
            ...createReqMeta(req),
          },
          error,
        })
        return res.redirect(redirectUrl)
      })
  )
}

export const handleConnectOauthCallback = [
  celebrate({
    [Segments.QUERY]: Joi.object({
      code: Joi.string().required(),
      state: Joi.string().required(),
    }).unknown(true),
  }),
  _handleConnectOauthCallback,
] as ControllerHandler[]
