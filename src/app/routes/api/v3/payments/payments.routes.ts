import { Router } from 'express'

import { rateLimitConfig } from '../../../../config/config'
import * as StripeController from '../../../../modules/payments/stripe.controller'
import { limitRate } from '../../../../utils/limit-rate'

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
  '/receipt/:formId([a-fA-F0-9]{24})/:paymentIntentId([a-fA-F0-9]{24})/status',
).get(StripeController.checkPaymentReceiptStatus)

/**
 * Downloads the receipt pdf
 * @route GET /payments/receipt/:formId/:submissionId/download
 *
 * @returns 200 with receipt URL exists
 */
PaymentsRouter.route(
  // '/receipt/:formId([a-fA-F0-9]{24})/:submissionId([a-fA-F0-9]{24})/download',
  // TODO: change to paymentIntentId in child funcs
  '/receipt/:formId([a-fA-F0-9]{24})/:paymentIntentId([a-fA-F0-9]{24})/download',
).get(
  limitRate({ max: rateLimitConfig.downloadPaymentReceipt }),
  StripeController.downloadPaymentReceipt,
)

PaymentsRouter.route('/stripe/callback').get(
  StripeController.handleConnectOauthCallback,
)

/**
 * returns clientSecret and publishableKey from paymentIntentId
 * @route /payments/:paymentIntentId/getInfo
 */
PaymentsRouter.route('/:paymentIntentId/getinfo').get(
  StripeController.getPaymentInfo,
)
