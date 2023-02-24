import { Router } from 'express'

import * as StripeController from '../../../../modules/payments/stripe.controller'

export const PaymentsRouter = Router()

PaymentsRouter.get('/stripe')

/**
 * Checks if the payment receipt is ready
 * @route GET /payments/receipt/:formId/:submissionId/status
 *
 * @returns 200 if receipt URL exists
 * @returns 404 if receipt URL does not exist
 */
PaymentsRouter.route(
  '/receipt/:formId([a-fA-F0-9]{24})/:submissionId([a-fA-F0-9]{24})/status',
).get(StripeController.checkPaymentReceiptStatus)

/**
 * Downloads the receipt pdf
 * @route GET /receipt/:formId/:submissionId/download
 *
 * @returns 200 with receipt URL exists
 */
PaymentsRouter.route(
  '/receipt/:formId([a-fA-F0-9]{24})/:submissionId([a-fA-F0-9]{24})/download',
).get(StripeController.getPaymentReceipt)

PaymentsRouter.route('/stripe/callback').get(
  StripeController.handleConnectOauthCallback,
)
