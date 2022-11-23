import { Router } from 'express'

import * as StripeController from '../../../../modules/payments/stripe.controller'

export const PaymentsRouter = Router()

PaymentsRouter.get('/stripe')

/**
 * Returns the receipt URL to the user
 * @route GET /receipt/:formId/:submissionId
 *
 * @returns 200 with receipt URL exists
 */
PaymentsRouter.route(
  '/receipt/:formId([a-fA-F0-9]{24})/:submissionId([a-fA-F0-9]{24})',
).get(StripeController.getPaymentReceipt)

PaymentsRouter.route('/stripe/callback').get(
  StripeController.handleConnectOauthCallback,
)
