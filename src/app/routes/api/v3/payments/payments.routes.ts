import { Router } from 'express'

import { rateLimitConfig } from '../../../../config/config'
import { withCronPaymentSecretAuthentication } from '../../../../modules/auth/auth.middlewares'
import * as PaymentsController from '../../../../modules/payments/payments.controller'
import * as StripeController from '../../../../modules/payments/stripe.controller'
import { limitRate } from '../../../../utils/limit-rate'

export const PaymentsRouter = Router()

PaymentsRouter.get('/stripe')

/**
 * Checks if the payment receipt is ready
 * @route GET /payments/:formId/:paymentId/receipt/status
 *
 * @returns 200 if receipt URL exists
 * @returns 404 if receipt URL does not exist or payment does not exist
 */
PaymentsRouter.route(
  '/:formId([a-fA-F0-9]{24})/:paymentId([a-fA-F0-9]{24})/receipt/status',
).get(StripeController.checkPaymentReceiptStatus)

/**
 * Downloads the receipt pdf
 * @route GET /payments/:formId/:paymentId/receipt/download
 *
 * @returns 200 with receipt attatchment as content in PDF
 * @returns 404 if receipt url doesn't exist or payment does not exist
 */
PaymentsRouter.route(
  '/:formId([a-fA-F0-9]{24})/:paymentId([a-fA-F0-9]{24})/receipt/download',
).get(
  limitRate({ max: rateLimitConfig.downloadPaymentReceipt }),
  StripeController.downloadPaymentReceipt,
)

/**
 * Downloads the invoice pdf
 * @route GET /payments/:formId/:paymentId/invoice/download
 *
 * @returns 200 with receipt attatchment as content in PDF
 * @returns 404 if receipt url doesn't exist or payment does not exist
 */
PaymentsRouter.route(
  '/:formId([a-fA-F0-9]{24})/:paymentId([a-fA-F0-9]{24})/invoice/download',
).get(
  limitRate({ max: rateLimitConfig.downloadPaymentReceipt }),
  StripeController.downloadPaymentInvoice,
)

PaymentsRouter.route('/stripe/callback').get(
  StripeController.handleConnectOauthCallback,
)

/**
 * returns clientSecret and publishableKey from paymentId
 * @route GET /payments/:paymentId/getinfo
 *
 * @returns 200 with payment information if payment id exist
 * @returns 404 when no pending submission is associated with the payment id
 * @returns 422 if the form associated is not in encrypted mode
 * @returns 500 if the form associated did not contain payment information
 * @returns 500 if error occured whilst retrieving payment information from stripe
 */
PaymentsRouter.route('/:paymentId([a-fA-F0-9]{24})/getinfo').get(
  StripeController.getPaymentInfo,
)

/**
 * Get previous latest successful payment id if it exists
 * Uses post request to collect the email data from the request body
 * @route POST /:formId/payments/previous
 *
 * @returns 200 if previous payment exists
 * @returns 404 if previous payment doesnt exists
 * @returns 500 when database error occurs
 */
PaymentsRouter.route('/:formId([a-fA-F0-9]{24})/payments/previous').post(
  limitRate({ max: rateLimitConfig.submissions }),
  PaymentsController.handleGetPreviousPaymentId,
)

const ProtectedPaymentRoutes = PaymentsRouter.use(
  withCronPaymentSecretAuthentication,
)

/**
 * Get all payments in incomplete state (Pending or Failed) which need to be
 * reconciled.
 * @protected
 * @route GET /payments/incompletePayments
 */
ProtectedPaymentRoutes.route('/incompletePayments').get(
  StripeController.getIncompletePayments,
)

/**
 * @protected
 * @route POST /payments/reconcileAccount
 *
 * @params stripeAccountId: string
 * @params daysAgo: optional number
 */
ProtectedPaymentRoutes.route('/reconcileAccount').post(
  StripeController.reconcileAccount,
)
