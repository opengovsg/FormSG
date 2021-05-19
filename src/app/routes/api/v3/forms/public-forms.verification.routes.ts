import { Router } from 'express'

import * as VerificationController from '../../../../modules/verification/verification.controller'

export const PublicFormsVerificationRouter = Router()

PublicFormsVerificationRouter.route(
  '/:formId([a-fA-F0-9]{24})/fieldverifications',
).post(VerificationController.handleCreateVerificationTransaction)

/**
 * Route for resetting the verification of a given field
 * @returns 204 when reset is successful
 * @returns 400 when the transaction has expired
 * @returns 404 when the form could not be found
 * @returns 404 when the transaction could not be found
 * @returns 404 when the field could not be found
 * @returns 500 when a database error occurs
 */
PublicFormsVerificationRouter.route(
  '/:formId([a-fA-F0-9]{24})/fieldverifications/:transactionId([a-fA-F0-9]{24})/fields/:fieldId([a-fA-F0-9]{24})/reset',
).post(VerificationController.handleResetFieldVerification)

/**
 * Route for verifying the otp for a given field
 * @returns 200 when the otp is correct and the parameters are valid
 * @returns 400 when TransactionExpiredError occurs
 * @returns 400 when MissingHashDataError occurs
 * @returns 404 when FormNotFoundError occurs
 * @returns 404 when TransactionNotFoundError occurs
 * @returns 404 when FieldNotFoundInTransactionError occurs
 * @returns 422 when OtpExpiredError occurs
 * @returns 422 when OtpRetryExceededError occurs
 * @returns 422 when WrongOtpError occurs
 * @returns 500 when HashingError occurs
 * @returns 500 when DatabaseError occurs
 */
PublicFormsVerificationRouter.route(
  '/:formId([a-fA-F0-9]{24})/fieldverifications/:transactionId([a-fA-F0-9]{24})/fields/:fieldId([a-fA-F0-9]{24})/otp/verify',
).post(VerificationController.handleOtpVerification)
