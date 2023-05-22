// Use 'stripe-event-types' for better type discrimination.
/// <reference types="stripe-event-types" />
import axios from 'axios'
import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'
import get from 'lodash/get'
import mongoose from 'mongoose'
import { errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import Stripe from 'stripe'

import { IPopulatedForm } from 'src/types'

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
import * as PendingSubmissionModel from '../pending-submission/pending-submission.service'
import { checkFormIsEncryptMode } from '../submission/encrypt-submission/encrypt-submission.service'

import { PaymentAccountInformationError } from './payments.errors'
import * as PaymentService from './payments.service'
import {
  StripeFetchError,
  StripeMetadataIncorrectEnvError,
} from './stripe.errors'
import * as StripeService from './stripe.service'
import {
  convertToInvoiceFormat,
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

  return PaymentService.findPaymentById(paymentId)
    .map((payment) => {
      logger.info({
        message: 'Found paymentId in payment document',
        meta: {
          action: 'checkPaymentReceiptStatus',
          payment,
        },
      })

      if (!payment.completedPayment?.receiptUrl) {
        return res.status(StatusCodes.NOT_FOUND).json({ isReady: false })
      }
      return res.status(StatusCodes.OK).json({ isReady: true })

      // no payment found, perhaps webhook from stripe has not arrived
      // trigger a manual sync flow
      // TODO: manual sync flow not available after https://github.com/opengovsg/FormSG/pull/5937
      // return StripeService.getPaymentFromLatestSuccessfulCharge(
      //   formId,
      //   paymentId,
      // )
      //   .map((payment) => {
      //     // has confirmedPayment but no receiptUrl, system is desync-ed
      //     if (!payment.completedPayment?.receiptUrl) {
      //       logger.error({
      //         message: 'has confirmedPayment but no receiptUrl',
      //         meta: {
      //           action: 'checkPaymentReceiptStatus',
      //           payment,
      //           paymentId,
      //           formId,
      //         },
      //       })
      //       return res
      //         .status(StatusCodes.INTERNAL_SERVER_ERROR)
      //         .json({ message: 'Missing receipt url' })
      //     }
      //     return res.status(StatusCodes.OK).json({ isReady: true })
      //   })
      //   .mapErr((error) => {
      //     return res.status(StatusCodes.NOT_FOUND).json({ message: error })
      //   })
    })
    .mapErr((error) => {
      return res.status(StatusCodes.NOT_FOUND).json({ message: error })
    })
}

/**
 * Handler for GET /api/v3/payments/:formId/:paymentId/invoice/download
 * Receives Stripe webhooks and updates the database with transaction details.
 *
 * @returns 200 if webhook is successfully processed
 * @returns 404 if the PaymentId is not found
 * @returns 404 if the FormId is not found
 * @returns 404 if payment.completedPayment?.receiptUrl is not found
 */
export const downloadPaymentInvoice: ControllerHandler<{
  formId: string
  paymentId: string
}> = (req, res) => {
  const { formId, paymentId } = req.params
  logger.info({
    message: 'downloadPaymentInvoice endpoint called',
    meta: {
      action: 'downloadPaymentInvoice',
      formId,
      paymentId,
    },
  })

  return ResultAsync.combine([
    PaymentService.findPaymentById(paymentId),
    FormService.retrieveFullFormById(formId).andThen(checkFormIsEncryptMode),
  ])
    .map(([payment, populatedForm]) => {
      logger.info({
        message: 'Found paymentId in payment document',
        meta: {
          action: 'downloadPaymentInvoice',
          payment,
        },
      })
      if (!payment.completedPayment?.receiptUrl) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .send({ message: 'Receipt url not ready' })
      }
      // retrieve receiptURL as html
      return (
        axios
          .get<string>(payment.completedPayment.receiptUrl)
          // convert to pdf and return
          .then((receiptUrlResponse) => {
            const html = receiptUrlResponse.data
            const agencyBusinessInfo = (populatedForm as IPopulatedForm).admin
              .agency.business
            const formBusinessInfo = populatedForm.business

            const businessAddress = [
              formBusinessInfo?.address,
              agencyBusinessInfo?.address,
            ].find(Boolean)

            const businessGstRegNo = [
              formBusinessInfo?.gstRegNo,
              agencyBusinessInfo?.gstRegNo,
            ].find(Boolean)

            // we will still continute the invoice generation even if there's no address/gstregno
            if (!businessAddress || !businessGstRegNo)
              logger.warn({
                message:
                  'Some business info not available during invoice generation. Expecting either agency or form to have business info',
                meta: {
                  action: 'downloadPaymentInvoice',
                  payment,
                  agencyName: populatedForm.admin.agency.fullName,
                  agencyBusinessInfo,
                  formBusinessInfo,
                },
              })
            const invoiceHtml = convertToInvoiceFormat(html, {
              address: businessAddress || '',
              gstRegNo: businessGstRegNo || '',
              formTitle: populatedForm.title,
              submissionId: payment.completedPayment?.submissionId || '',
            })

            const pdfBufferPromise = generatePdfFromHtml(invoiceHtml)
            return pdfBufferPromise
          })
          .then((pdfBuffer) => {
            res.set({
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename=${paymentId}-invoice.pdf`,
            })
            return res.status(StatusCodes.OK).send(pdfBuffer)
          })
      )
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error retrieving invoice',
        meta: {
          action: 'downloadPaymentInvoice',
          formId,
          paymentId,
        },
        error,
      })
      return res.status(StatusCodes.NOT_FOUND).json({ message: error })
    })
}

/**
 * Handler for GET /api/v3/payments/:formId/:paymentId/invoice/download
 * Receives Stripe webhooks and updates the database with transaction details.
 *
 * @returns 200 if webhook is successfully processed
 * @returns 404 if the PaymentId is not found
 * @returns 404 if the FormId is not found
 * @returns 404 if payment.completedPayment?.receiptUrl is not found
 */
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

  return PaymentService.findPaymentById(paymentId)
    .map((payment) => {
      logger.info({
        message: 'Found paymentId in payment document',
        meta: {
          action: 'downloadPaymentReceipt',
          payment,
        },
      })
      if (!payment.completedPayment?.receiptUrl) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .send({ message: 'Receipt url not ready' })
      }
      // retrieve receiptURL as html
      return (
        axios
          .get<string>(payment.completedPayment.receiptUrl)
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

  // Step 0: Extract state parameter previously signed and stored in cookies.
  // Compare state values to ensure that no tampering has occurred.
  const { stripeState } = req.signedCookies
  if (state !== stripeState) {
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

export const getPaymentInfo: ControllerHandler<
  { paymentId: string },
  GetPaymentInfoDto | ErrorDto
> = async (req, res) => {
  const { paymentId } = req.params

  const logMeta = {
    action: 'getPaymentInfo',
    paymentId,
  }

  logger.info({
    message: 'getPaymentInfo endpoint called',
    meta: logMeta,
  })

  return PaymentService.findPaymentById(paymentId)
    .andThen((payment) => {
      return PendingSubmissionModel.findPendingSubmissionById(
        payment.pendingSubmissionId,
      )
        .andThen((submission) =>
          FormService.retrieveFullFormById(submission.form),
        )
        .andThen(checkFormIsEncryptMode) // Payment forms are encrypted
        .andThen((form) => {
          const stripeAccount = payment.targetAccountId
          // Early termination to prevent consumption of QPS limit to stripe
          if (stripeAccount !== form.payments_channel.target_account_id) {
            logger.error({
              message:
                'Target stripe account for this form has changed, unable to get payment info',
              meta: logMeta,
            })
            return errAsync(new PaymentAccountInformationError())
          }

          const paymentIntentId = payment.paymentIntentId
          return ResultAsync.fromPromise(
            stripe.paymentIntents.retrieve(paymentIntentId, {
              stripeAccount,
            }),
            (error) => {
              logger.error({
                message: 'Calling stripe.paymentIntents.retrieve failed',
                meta: {
                  ...logMeta,
                  paymentIntentId,
                  error,
                },
              })
              return new StripeFetchError(String(error))
            },
          ).map((paymentIntent) => {
            return res.status(StatusCodes.OK).json({
              client_secret: paymentIntent.client_secret || '',
              publishableKey: form.payments_channel.publishable_key,
              payment_intent_id: payment.paymentIntentId,
              submissionId: payment.pendingSubmissionId,
            })
          })
        })
    })
    .mapErr((error) => {
      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}
