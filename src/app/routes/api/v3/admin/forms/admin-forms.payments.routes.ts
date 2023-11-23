import { Router } from 'express'

import * as AdminPaymentsController from '../../../../../modules/form/admin-form/admin-form.payments.controller'
import { disabledOnPlayground } from '../../../../../utils/disabled-on-playground'

export const AdminFormsPaymentsRouter = Router()

AdminFormsPaymentsRouter.route('/:formId([a-fA-F0-9]{24})/stripe')
  /**
   * Update the specified form stripe credentials
   * @route POST /:formId/stripe
   * @security session
   *
   * @returns 200 with Stripe redirect URL to complete OAuth flow
   * @returns 401 when user is not logged in
   * @returns 403 when user does not have permissions to update the form
   * @returns 404 when form to update cannot be found
   * @returns 410 when form to update has been deleted
   * @returns 422 when id of user who is updating the form cannot be found
   * @returns 422 when the form to be updated is not an encrypt mode form
   * @returns 500 when database error occurs
   */
  .post(disabledOnPlayground, AdminPaymentsController.handleConnectAccount)
  /**
   * Delete the specified form stripe credentials
   * @route DELETE /:formId/stripe
   * @security session
   *
   * @returns 200 when Stripe credentials successfully deleted
   * @returns 401 when user is not logged in
   * @returns 403 when user does not have permissions to update the form
   * @returns 404 when form to update cannot be found
   * @returns 410 when form to update has been deleted
   * @returns 422 when id of user who is updating the form cannot be found
   * @returns 422 when the form to be updated is not an encrypt mode form
   * @returns 500 when database error occurs
   */
  .delete(disabledOnPlayground, AdminPaymentsController.handleUnlinkAccount)

/**
 * Validate that the connected Stripe account is able to receive payments.
 * @route GET /:formId/stripe/validate
 * @security session
 *
 * @returns 200 when Stripe credentials have been validated
 * @returns 401 when user is not logged in
 * @returns 403 when user does not have permissions to update the form
 * @returns 404 when form to update cannot be found
 * @returns 410 when form to update has been deleted
 * @returns 422 when id of user who is updating the form cannot be found
 * @returns 422 when the form to be updated is not an encrypt mode form
 * @returns 500 when database error occurs
 * @returns 502 when the connected Stripe credentials are invalid
 */
AdminFormsPaymentsRouter.route('/:formId([a-fA-F0-9]{24})/stripe/validate').get(
  AdminPaymentsController.handleValidatePaymentAccount,
)

/**
 * Replaces the payments data of the given form with what is given in the request
 * @precondition Must be preceded by request validation
 * @security session
 *
 * @returns 200 with updated payments
 * @returns 400 when updated payment amount is out of bounds
 * @returns 403 when current user does not have permissions to update the payments
 * @returns 404 when form cannot be found
 * @returns 410 when updating the payments for an archived form
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsPaymentsRouter.put(
  '/:formId([a-fA-F0-9]{24})/payments',
  AdminPaymentsController.handleUpdatePayments,
)

/**
 * Replaces the payments data of the given form with what is given in the request
 * @precondition Must be preceded by request validation
 * @security session
 *
 * #TODO
 */
AdminFormsPaymentsRouter.put(
  '/:formId([a-fA-F0-9]{24})/payments/products',
  AdminPaymentsController.handleUpdatePaymentsProduct,
)

AdminFormsPaymentsRouter.get(
  '/guide/payments',
  AdminPaymentsController.handleGetPaymentGuideLink,
)
