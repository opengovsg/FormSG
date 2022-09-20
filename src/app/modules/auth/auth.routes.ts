import { Router } from 'express'

import { rateLimitConfig } from '../../config/config'
import { limitRate } from '../../utils/limit-rate'

import * as AuthController from './auth.controller'

/** @deprecated use AuthRouter in src/app/routes/api/v3/auth/auth.routes.ts instead. */
export const AuthRouter = Router()

/**
 * Check if email domain is a valid agency
 * @route POST /auth/checkuser
 * @group admin
 * @param body.email the user's email to validate domain for
 * @return 200 when email domain is valid
 * @return 401 when email domain is invalid
 */
AuthRouter.post('/checkuser', AuthController.handleCheckUser)

/**
 * Send a one-time password (OTP) to the specified email address
 * as part of the login procedure.
 * @route POST /auth/sendotp
 * @group admin
 * @param body.email the user's email to validate domain for
 * @produces application/json
 * @consumes application/json
 * @return 200 when OTP has been been successfully sent
 * @return 401 when email domain is invalid
 * @return 500 when FormSG was unable to generate the OTP, or create/send the email that delivers the OTP to the user's email address
 */
AuthRouter.post(
  '/sendotp',
  limitRate({ max: rateLimitConfig.sendAuthOtp }),
  AuthController.handleLoginSendOtp,
)

/**
 * Verify the one-time password (OTP) for the specified email address
 * as part of the login procedure.
 * @route POST /auth/verifyotp
 * @group admin
 * @param body.email the user's email
 * @param body.otp the otp to verify
 * @headers 200.set-cookie contains the session cookie upon login
 * @returns 200 when user has successfully logged in, with session cookie set
 * @returns 401 when the email domain is invalid
 * @returns 422 when the OTP is invalid
 * @returns 500 when error occurred whilst verifying the OTP
 */
AuthRouter.post('/verifyotp', AuthController.handleLoginVerifyOtp)

/**
 * Sign the user out of the session by clearing the relevant session cookie
 * @route GET /auth/signout
 * @group admin
 * @headers 200.clear-cookie clears cookie upon signout
 * @returns 200 when user has signed out successfully
 * @returns 400 when the request does not contain a session
 * @returns 500 when the session fails to be destroyed
 */
AuthRouter.get('/signout', AuthController.handleSignout)
