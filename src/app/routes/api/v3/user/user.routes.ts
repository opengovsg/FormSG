import { Router } from 'express'

import { rateLimitConfig } from '../../../../config/config'
import * as UserController from '../../../../modules/user/user.controller'
import { limitRate } from '../../../../utils/limit-rate'

export const UserRouter = Router()

// * / main route

/**
 * Retrieves and returns the session user from the database.
 * @route GET /
 * @returns 200 with the retrieved user if session user is valid
 * @returns 401 if user is not currently logged in
 * @returns 422 when userId does not exist in the database
 * @returns 500 when user cannot be found or database errors occurs
 */
UserRouter.get('/', UserController.handleFetchUser)

// * /contact subroute

/**
 * Send a contact verification one-time password (OTP) to the specified contact
 * number as part of the contact verification process
 * @route POST /user/contact/otp/generate
 * @param body.contact the contact number to send otp to
 * @param body.userId the id of the user
 * @returns 200 if OTP was successfully sent
 * @returns 422 on OTP creation or SMS send failure, or if the user cannot be found
 * @returns 500 on application or database errors
 */
UserRouter.post(
  '/contact/otp/generate',
  limitRate({ max: rateLimitConfig.sendAuthOtp }),
  UserController.handleContactSendOtp,
)

/**
 * Verify the contact verification one-time password (OTP) for the user as part
 * of the contact verification process
 * @route POST /user/contact/otp/verify
 * @param body.userId the user's id to verify
 * @param body.otp the otp to verify
 * @param body.contact the contact of the user to check stored match
 * @returns 200 when user contact update success
 * @returns 422 when OTP is invalid
 * @returns 500 when OTP is malformed or for unknown errors
 */
UserRouter.post(
  '/contact/otp/verify',
  limitRate({ max: rateLimitConfig.sendAuthOtp }),
  UserController.handleContactVerifyOtp,
)

/**
 * Verify the contact verification one-time password (OTP) for the user as part
 * of the contact verification process
 * @route POST /user/flag/new-features-last-seen
 * @returns 200 when user last seen feature update updates sucessfully
 * @returns 401 if user is not currently logged in
 * @returns 422 when userId does not exist in the database
 * @returns 500 when database errors occurs
 */
UserRouter.post(
  '/flag/new-features-last-seen',
  UserController.handleUpdateUserLastSeenFeatureUpdateVersion,
)

export default UserRouter
