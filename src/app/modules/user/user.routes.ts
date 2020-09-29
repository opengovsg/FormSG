import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import * as UserController from './user.controller'

const UserRouter = Router()

// * / main route

/**
 * Retrieves and returns the session user from the database.
 * @route GET /
 * @returns 200 with the retrieved user if session user is valid
 * @returns 401 if user id does not exist in session
 * @returns 500 when user cannot be found or database errors occurs
 */
UserRouter.get('/', UserController.handleFetchUser)

// * /contact subroute

/**
 * Send a contact verification one-time password (OTP) to the specified contact
 * number as part of the contact verification process
 * @route POST /user/contact/sendotp
 * @param body.contact the contact number to send otp to
 * @param body.userId the id of the user
 * @returns 200 if OTP was successfully sent
 * @returns 422 on OTP creation or SMS send failure, or if the user cannot be found
 * @returns 500 on application or database errors
 */
UserRouter.post(
  '/contact/sendotp',
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      contact: Joi.string().required(),
      userId: Joi.string().required(),
    }),
  }),
  UserController.handleContactSendOtp,
)

/**
 * Verify the contact verification one-time password (OTP) for the user as part
 * of the contact verification process
 * @route POST /user/contact/verifyotp
 * @param body.userId the user's id to verify
 * @param body.otp the otp to verify
 * @param body.contact the contact of the user to check stored match
 * @returns 200 when user contact update success
 * @returns 422 when OTP is invalid
 * @returns 500 when OTP is malformed or for unknown errors
 */
UserRouter.post(
  '/contact/verifyotp',
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      userId: Joi.string().required(),
      otp: Joi.string().length(6).required(),
      contact: Joi.string().required(),
    }),
  }),
  UserController.handleContactVerifyOtp,
)

export default UserRouter
