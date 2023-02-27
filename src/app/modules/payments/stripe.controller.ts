// Use 'stripe-event-types' for better type discrimination.
/// <reference types="stripe-event-types" />
import axios from 'axios'
import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'
import get from 'lodash/get'
import Stripe from 'stripe'

import { PaymentStatus } from '../../../../shared/types'
import config from '../../config/config'
import { paymentConfig } from '../../config/features/payment.config'
import { createLoggerWithLabel } from '../../config/logger'
import { stripe } from '../../loaders/stripe'
import { generatePdfFromHtml } from '../../utils/convert-html-to-pdf'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'
import { retrieveFullFormById } from '../form/form.service'

import * as StripeService from './stripe.service'

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

/**
 * Handler for GET /api/v3/notifications/stripe
 * NOTE: This is exported solely for testing
 * Receives Stripe webhooks and updates the database with transaction details.
 *
 * @returns 200 if webhook is successfully processed
 * @returns 400 if the Stripe-Signature header is missing or invalid
 * @returns 500 if any errors occurs in processing the webhook or saving payment to DB
 */
export const _handleStripeEventUpdates: ControllerHandler<
  unknown,
  never,
  string
> = async (req, res) => {
  // Step 1: Verify the payload and ensure that it is indeed sent from Stripe.
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
    logger.warn({
      message: 'Received invalid request from Stripe webhook endpoint',
      meta: {
        action: 'handleStripeEventUpdates',
        req: req.body,
        error: e,
      },
    })
    return res.status(StatusCodes.BAD_REQUEST).send()
  }

  // Step 2: Received event, proceed to process it.
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
      await StripeService.updateWebhookBySubmissionId(
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
    case 'charge.dispute.updated': {
      event = await stripe.events.retrieve(event.id, {
        expand: ['data.object.charge'],
      })
      // These are known since the 'charge' property was expanded
      const dispute = event.data.object as Stripe.Dispute
      const charge = dispute.charge as Stripe.Charge
      await StripeService.updateWebhookBySubmissionId(
        charge.metadata,
        {},
        event,
      )
      break
    }
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
      await StripeService.updateWebhookBySubmissionId(
        event.data.object.metadata,
        {},
        event,
      )
      break
    case 'payout.canceled':
    case 'payout.created':
    case 'payout.failed':
    case 'payout.paid':
    case 'payout.updated':
      // This is most definitely wrong but need to test when payouts come in
      await StripeService.updateWebhookBySubmissionId(
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

  return StripeService.getReceiptURL(formId, submissionId)
    .map((receiptUrl) => {
      logger.info({
        message: 'Received receipt url from Stripe webhook',
        meta: {
          action: 'checkPaymentReceiptStatus',
          receiptUrl,
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

  return StripeService.getReceiptURL(formId, submissionId)
    .map((receiptUrl) => {
      logger.info({
        message: 'Received receipt url from Stripe webhook',
        meta: {
          action: 'downloadPaymentReceipt',
          receiptUrl,
        },
      })
      // retrieve receiptURL as html
      return (
        axios
          .get<string>(receiptUrl)
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
