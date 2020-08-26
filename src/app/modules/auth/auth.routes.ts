import { celebrate } from 'celebrate'
import { Router } from 'express'
import HttpStatus from 'http-status-codes'

import * as OldAuthController from '../../controllers/authentication.server.controller'

import * as AuthRules from './auth.rules'

export const AuthRouter = Router()

/**
 * Check if email domain is a valid agency
 * @route POST /auth/checkuser
 * @group admin
 * @param body.email - the user's email
 * @returns 200 when user has logged in before
 * @returns 400 with a message indicating a bad email address when email is invalid
 */
AuthRouter.post(
  '/checkuser',
  celebrate(AuthRules.forCheckUser),
  OldAuthController.validateDomain,
  (_, res) => res.sendStatus(HttpStatus.OK),
)

/**
 * Send a one-time password (OTP) to the specified email address
 * as part of the login procedure.
 * @route POST /auth/sendotp
 * @group admin
 * @param body.email the user's email
 * @produces application/json
 * @consumes application/json
 * @returns 200 when OTP has been been successfully sent
 * @returns 400 with a message indicating either a bad email address, or that the agency indicated in the email address has not been onboarded to FormSG when that situation occurs
 * @returns 500 when FormSG was unable to generate the OTP, or create/send the email that delivers the OTP to the user's email address
 */
AuthRouter.post(
  '/sendotp',
  celebrate(AuthRules.forSendOtp),
  OldAuthController.validateDomain,
  OldAuthController.createOtp,
  OldAuthController.sendOtp,
)

/**
 * Verify the one-time password (OTP) for the specified email address
 * as part of the login procedure.
 * @route POST /auth/verifyotp
 * @group admin
 * @param body.email the user's email
 * @param body.otp the otp to verify
 * @returns 200 when user has successfully logged in, with session cookie set
 * @returns 400 when the OTP is invalid or has expired, or the email is invalid
 * @returns 500 when error occurred whilst verifying the OTP
 * @headers 200.set-cookie - contains the session cookie upon login
 */
AuthRouter.post(
  '/verifyotp',
  celebrate(AuthRules.forVerifyOtp),
  OldAuthController.validateDomain,
  OldAuthController.verifyOtp,
  OldAuthController.signIn,
)

/**
 * Sign the user out of the session by clearing the relevant session cookie
 * @route GET /auth/signout
 * @group admin
 * @returns 200 when user has signed out successfully
 * @returns 400 when the signout failed for one reason or another
 */
AuthRouter.get('/signout', OldAuthController.signOut)
