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
 * Route for generating a new otp for a given field
 * @returns 200 when otp generated successfully
 * @returns 400 when the parameters could not be parsed
 * @returns 400 when the transaction has expired
 * @returns 400 when the otp data could not be retrieved from the database
 * @returns 400 when the otp could not be sent via sms
 * @returns 400 when the otp could not be sent via email
 * @returns 400 when the provided phone number is not valid
 * @returns 400 when the field type is not supported for validation
 * @returns 404 when the requested form was not found
 * @returns 422 when the user requested for a new otp without waiting
 * @returns 500 when the otp could not be hashed
 * @returns 500 when the transaction could not be found
 * @returns 500 when the field could not be found in the transaction
 * @returns 500 when there is a database error
 */
PublicFormsVerificationRouter.route(
  '/:formId([a-fA-F0-9]{24})/fieldverifications/:transactionId([a-fA-F0-9]{24})/fields/:fieldId([a-fA-F0-9]{24})/otp/generate',
).post(VerificationController.handleGenerateOtp)
