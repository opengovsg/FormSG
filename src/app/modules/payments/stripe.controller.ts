// Use 'stripe-event-types' for better type discrimination.
/// <reference types="stripe-event-types" />
import axios from 'axios'
import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'
import get from 'lodash/get'
import mongoose from 'mongoose'
import { errAsync, ok, Result, ResultAsync } from 'neverthrow'
import Stripe from 'stripe'

import { ErrorDto, GetPaymentInfoDto } from '../../../../shared/types'
import config from '../../config/config'
import { paymentConfig } from '../../config/features/payment.config'
import { createLoggerWithLabel } from '../../config/logger'
import { stripe } from '../../loaders/stripe'
import getPaymentModel from '../../models/payment.server.model'
import { generatePdfFromHtml } from '../../utils/convert-html-to-pdf'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'
import * as FormService from '../form/form.service'
import { isFormEncryptMode } from '../form/form.utils'
import * as PendingSubmissionModel from '../pending-submission/pending-submission.service'
import { checkFormIsEncryptMode } from '../submission/encrypt-submission/encrypt-submission.service'

import * as PaymentService from './payments.service'
import { StripeFetchError } from './stripe.errors'
import * as StripeService from './stripe.service'
import {
  getChargeIdFromNestedCharge,
  getMetadataPaymentId,
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
 * @returns 400 if the Stripe-Signature header is missing or invalid
 * @returns 422 if any errors occurs in processing the webhook or saving payment to DB
 * @returns 500 if any unexpected errors occur
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
        StripeService.processStripeEvent(paymentId, event),
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
      // Additional logging with error details
      logger.error({
        message: 'Error thrown in webhook handler',
        meta: logMeta,
        error,
      })
      // TODO: Add map route error here
      return res.status(StatusCodes.UNPROCESSABLE_ENTITY)
    },
  )
}

export const handleStripeEventUpdates = [
  validateStripeEvent,
  _handleStripeEventUpdates,
]

export const checkPaymentReceiptStatus: ControllerHandler<{
  formId: string
  paymentId: string
}> = async (req, res) => {
  const { formId, paymentId } = req.params
  logger.info({
    message: 'getPaymentStatus endpoint called',
    meta: {
      action: 'getPaymentStatus',
      formId,
      paymentId,
    },
  })

  return PaymentService.findPaymentByPaymentIntentId(paymentId).map(
    (payment) => {
      logger.info({
        message: 'Found paymentId in payment document',
        meta: {
          action: 'checkPaymentReceiptStatus',
          payment,
        },
      })

      if (payment.completedPayment?.receiptUrl) {
        return res.status(StatusCodes.OK).json({ isReady: true })
      }
      // no payment found, perhaps webhook from stripe has not arrived
      // trigger a manual sync flow
      return StripeService.getPaymentFromLatestSuccessfulCharge(
        formId,
        paymentId,
      )
        .map((payment) => {
          // has confirmedPayment but no receiptUrl, system is desync-ed
          if (!payment.completedPayment?.receiptUrl) {
            logger.error({
              message: 'has confirmedPayment but no receiptUrl',
              meta: {
                action: 'checkPaymentReceiptStatus',
                payment,
                paymentId,
                formId,
              },
            })
            return res
              .status(StatusCodes.INTERNAL_SERVER_ERROR)
              .json({ message: 'Missing receipt url' })
          }
          return res.status(StatusCodes.OK).json({ isReady: true })
        })
        .mapErr((error) => {
          return res.status(StatusCodes.NOT_FOUND).json({ message: error })
        })
    },
  )
}

// TODO: Refactor for use in static payment url implementation
export const downloadPaymentReceipt: ControllerHandler<{
  formId: string
  paymentId: string
}> = (req, res) => {
  const { formId, paymentId } = req.params
  logger.info({
    message: 'downloadPaymentReceipt endpoint called',
    meta: {
      action: 'downloadPaymentReceipt',
      formId,
      paymentId,
    },
  })

  return PaymentService.findPaymentByPaymentIntentId(paymentId)
    .map((payment) => {
      logger.info({
        message: 'Found paymentId in payment document',
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
              'Content-Disposition': `attachment; filename=${paymentId}-receipt.pdf`,
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
          formId,
          paymentId,
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
    FormService.retrieveFullFormById(formId)
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

// #TODO: think about where to place this payment fetcher, should it be strongly tied to stripe?
export const getPaymentInfo: ControllerHandler<
  {
    paymentId: string
  },
  GetPaymentInfoDto | ErrorDto
> = async (req, res) => {
  const { paymentId } = req.params
  logger.info({
    message: 'getPaymentInfo endpoint called',
    meta: {
      action: 'getPaymentInfo',
      paymentId,
    },
  })

  return PaymentService.findPaymentByPaymentIntentId(paymentId)
    .andThen((payment) =>
      PendingSubmissionModel.findPendingSubmissionById(
        payment.pendingSubmissionId,
      ),
    )
    .andThen((submission) => FormService.retrieveFormById(submission.form))
    .andThen((form) => {
      // Payment forms are encrypted
      if (!isFormEncryptMode(form)) {
        logger.warn({
          message:
            'Requested for payment information for possibly non-payment form',
          meta: {
            action: 'getPaymentInfo',
            paymentId,
          },
        })
        // TODO: change to error object
        return errAsync(new Error('Is not a payment form'))
      }
      const stripeAccount = form.payments_channel?.target_account_id
      // Early termination to prevent consumption of QPS limit to stripe
      if (!stripeAccount) {
        logger.warn({
          message: 'Missing payments_channel on this form',
          meta: {
            action: 'getPaymentInfo',
            paymentId,
          },
        })
        // TODO: change to error object
        return errAsync(new Error('Is not a payment form'))
      }

      return ResultAsync.fromPromise(
        stripe.paymentIntents.retrieve(paymentId, {
          stripeAccount,
        }),
        (error) => {
          logger.error({
            message: 'stripe.paymentIntents.retrieve called',
            meta: {
              action: 'getPaymentInfo',
              paymentId,
              error,
            },
          })
          return new StripeFetchError(String(error))
        },
      ).map((stripeFullIntentObj) => ({
        stripeFullIntentObj,
        // TODO: check publiashable key seemed to be tied to payment intent?
        publishableKey: form.payments_channel?.publishable_key || '',
      }))
    })
    .map(({ stripeFullIntentObj, publishableKey }) => {
      return res.status(StatusCodes.OK).json({
        client_secret: stripeFullIntentObj.client_secret || '',
        publishableKey,
      })
    })
    .mapErr((e) => {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: e.message })
    })
}
