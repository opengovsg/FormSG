import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import { rateLimitConfig } from '../../../../config/config'
import * as AuthController from '../../../../modules/auth/auth.controller'
import { limitRate } from '../../../../utils/limit-rate'

export const AuthRouter = Router()
/**
 * Check if email domain is a valid agency
 * @route POST /auth/email/validate
 * @group admin
 * @param body.email the user's email to validate domain for
 * @return 200 when email domain is valid
 * @return 401 when email domain is invalid
 */
AuthRouter.post(
  '/email/validate',
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      email: Joi.string()
        .required()
        .email()
        .message('Please enter a valid email'),
    }),
  }),
  AuthController.handleCheckUser,
)

/**
 * Send a one-time password (OTP) to the specified email address
 * as part of the login procedure.
 * @route POST /auth/otp/generate
 * @group admin
 * @param body.email the user's email to validate domain for
 * @produces application/json
 * @consumes application/json
 * @return 200 when OTP has been been successfully sent
 * @return 401 when email domain is invalid
 * @return 500 when FormSG was unable to generate the OTP, or create/send the email that delivers the OTP to the user's email address
 */
AuthRouter.post(
  '/otp/generate',
  limitRate({ max: rateLimitConfig.sendAuthOtp }),
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      email: Joi.string()
        .required()
        .email()
        .message('Please enter a valid email'),
    }),
  }),
  AuthController.handleLoginSendOtp,
)

/**
 * Verify the one-time password (OTP) for the specified email address
 * as part of the login procedure.
 * @route POST /auth/otp/verify
 * @group admin
 * @param body.email the user's email
 * @param body.otp the otp to verify
 * @headers 200.set-cookie contains the session cookie upon login
 * @returns 200 when user has successfully logged in, with session cookie set
 * @returns 401 when the email domain is invalid
 * @returns 422 when the OTP is invalid
 * @returns 500 when error occurred whilst verifying the OTP
 */
AuthRouter.post(
  '/otp/verify',
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      email: Joi.string()
        .required()
        .email()
        .message('Please enter a valid email'),
      otp: Joi.string()
        .required()
        .regex(/^\d{6}$/)
        .message('Please enter a valid otp'),
    }),
  }),
  AuthController.handleLoginVerifyOtp,
)

/**
 * Sign the user out of the session by clearing the relevant session cookie
 * @route GET /auth/logout
 * @group admin
 * @headers 200.clear-cookie clears cookie upon signout
 * @returns 200 when user has signed out successfully
 * @returns 400 when the request does not contain a session
 * @returns 500 when the session fails to be destroyed
 */
AuthRouter.get('/logout', AuthController.handleSignout)
