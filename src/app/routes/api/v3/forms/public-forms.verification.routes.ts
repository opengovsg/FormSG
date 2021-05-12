import { Router } from 'express'

import * as VerificationController from '../../../../modules/verification/verification.controller'

export const PublicFormsVerificationRouter = Router()

PublicFormsVerificationRouter.route(
  '/:formId([a-fA-F0-9]{24})/fieldverifications',
).post(VerificationController.handleCreateVerificationTransaction)

/**
 * Route for resetting the verification of a given field
 * @returns 400 when the transaction has expired
 * @returns 404 when the form could not be found
 * @returns 404 when the transaction could not be found
 * @returns 404 when the field could not be found
 * @returns 500 when a database error occurs
 */
PublicFormsVerificationRouter.route(
  '/:formId([a-fA-F0-9]{24})/fieldverification/:transactionId([a-fA-F0-9]{24})/fields/:fieldId([a-fA-F0-9]{24})/reset',
).post(VerificationController.handleResetFieldVerification)
