import { Router } from 'express'

import { rateLimitConfig } from '../../../../config/config'
import { withCronPaymentSecretAuthentication } from '../../../../modules/auth/auth.middlewares'
import * as PaymentProofController from '../../../../modules/payments/payment-proof.controller'
import * as PaymentsController from '../../../../modules/payments/payments.controller'
import * as StripeController from '../../../../modules/payments/stripe/stripe.controller'
import { limitRate } from '../../../../utils/limit-rate'

export const PaymentsRouter = Router()

/**
 * Checks if the payment receipt is ready
 * @route GET /payments/:formId/:paymentId/receipt/status
 *
 * @returns 200 if receipt URL exists
 * @returns 404 if receipt URL does not exist or payment does not exist
 */
PaymentsRouter.get(
  '/:formId([a-fA-F0-9]{24})/:paymentId([a-fA-F0-9]{24})/receipt/status',
  StripeController.checkPaymentReceiptStatus,
)

/**
 * Downloads the invoice pdf
 * @route GET /payments/:formId/:paymentId/invoice/download
 *
 * @returns 200 with receipt attachment as content in PDF
 * @returns 404 if receipt url doesn't exist or payment does not exist
 */
PaymentsRouter.get(
  '/:formId([a-fA-F0-9]{24})/:paymentId([a-fA-F0-9]{24})/invoice/download',
  limitRate({ max: rateLimitConfig.downloadPaymentReceipt }),
  PaymentProofController.downloadPaymentInvoice,
)

PaymentsRouter.get(
  '/stripe/callback',
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
PaymentsRouter.get(
  '/:paymentId([a-fA-F0-9]{24})/getinfo',
  StripeController.getPaymentInfo, // TODO(KEN): refactor to be channel agnostic
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
PaymentsRouter.post(
  '/:formId([a-fA-F0-9]{24})/payments/previous',
  limitRate({ max: rateLimitConfig.submissions }),
  PaymentsController.handleGetPreviousPaymentId,
)

/**
 * Protected routes for CRON job. Not really REST style, more like RPC style.
 */
const ProtectedPaymentsRouter = Router()

ProtectedPaymentsRouter.use(withCronPaymentSecretAuthentication)

/**
 * Get all payments in incomplete state (Pending or Failed) which need to be
 * reconciled.
 * @protected
 * @route GET /payments/reconcile/incompletePayments
 *
 * @returns 200 with found payment records
 * @returns 500 if there were unexpected errors in retrieving payment data
 */
ProtectedPaymentsRouter.get(
  '/incompletePayments',
  StripeController.getIncompletePayments,
)

/**
 * Reconciles all payments within an account by re-processing all undelivered
 * events.
 * @protected
 * @route POST /payments/reconcile/account/:stripeAccount?maxAgeHrs=<number>
 *
 * @returns 200 with two report arrays, one for event processing and another for payment status verification
 * @returns 500 if there were unexpected errors in retrieving data from Stripe
 */
ProtectedPaymentsRouter.post(
  '/account/:stripeAccount',
  StripeController.reconcileAccount,
)

PaymentsRouter.use('/reconcile', ProtectedPaymentsRouter)

/**
 * Get previous latest successful payment id if it exists
 * Uses post request to collect the email data from the request body
 * @route POST /payments/onboarding
 *
 * @returns 200 if onboarding email sent
 * @returns 403 if email domain is not whitelisted
 * @returns 400 if email sending fails
 * @returns 500 when database error occurs
 */
PaymentsRouter.post('/onboarding', PaymentsController.handleSendOnboardingEmail)
