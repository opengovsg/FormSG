import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { IPopulatedUser } from '../../../types'
import SmsFactory from '../../factories/sms.factory'
import { getRequestIp } from '../../utils/request'

import {
  createContactOtp,
  getPopulatedUserById,
  updateUserContact,
  verifyContactOtp,
} from './user.service'
import { mapRouteError } from './user.utils'

const logger = createLoggerWithLabel(module)

/**
 * Generates an OTP and sends the OTP to the given contact in request body.
 * @route POST /contact/sendotp
 * @returns 200 if OTP was successfully sent
 * @returns 401 if user id does not match current session user or if user is not currently logged in
 * @returns 422 on OTP creation or SMS send failure
 * @returns 422 if user id does not exist in the database
 * @returns 500 if database errors occurs
 */
export const handleContactSendOtp: RequestHandler<
  ParamsDictionary,
  string,
  { contact: string; userId: string }
> = async (req, res) => {
  // Joi validation ensures existence.
  const { contact, userId } = req.body
  const sessionUserId = getUserIdFromSession(req.session)

  // Guard against user updating for a different user, or if user is not logged
  // in.
  if (!sessionUserId || sessionUserId !== userId) {
    return res.status(StatusCodes.UNAUTHORIZED).send('User is unauthorized.')
  }

  const logMeta = {
    action: 'handleContactSendOtp',
    userId,
    ip: getRequestIp(req),
  }

  return (
    // Step 1: Create OTP for contact verification.
    createContactOtp(userId, contact)
      // Step 2: Send verification OTP to contact.
      .andThen((otp) => SmsFactory.sendAdminContactOtp(contact, otp, userId))
      // Step 3a: Successfully sent OTP.
      .map(() => {
        logger.info({
          message: 'Contact verification OTP sent successfully',
          meta: logMeta,
        })
        return res.sendStatus(StatusCodes.OK)
      })
      // Step 3b: Error occurred whilst sending OTP.
      .mapErr((error) => {
        logger.error({
          message: 'Error sending contact verification OTP',
          meta: logMeta,
          error,
        })

        const { errorMessage, statusCode } = mapRouteError(error)
        return res.status(statusCode).send(errorMessage)
      })
  )
}

/**
 * Verifies given OTP with the hashed OTP data, and updates the user's contact
 * number if the hash matches.
 * @route POST /contact/verifyotp
 * @returns 200 when user contact update success
 * @returns 401 if user id does not match current session user or if user is not currently logged in
 * @returns 422 when OTP is invalid
 * @returns 500 when OTP is malformed or for unknown errors
 */
export const handleContactVerifyOtp: RequestHandler<
  ParamsDictionary,
  string | IPopulatedUser,
  {
    userId: string
    otp: string
    contact: string
  }
> = async (req, res) => {
  // Joi validation ensures existence.
  const { userId, otp, contact } = req.body
  const sessionUserId = getUserIdFromSession(req.session)

  // Guard against user updating for a different user, or if user is not logged
  // in.
  if (!sessionUserId || sessionUserId !== userId) {
    return res.status(StatusCodes.UNAUTHORIZED).send('User is unauthorized.')
  }

  // Step 1: Verify contact and otp of user matches with stored hash.
  return (
    verifyContactOtp(otp, contact, userId)
      // Step 2: Matches, update user with new contact.
      .andThen(() => updateUserContact(contact, userId))
      // Step 3a: No error, return updated user.
      .map((updatedUser) => res.status(StatusCodes.OK).send(updatedUser))
      // Step 3b: Error occured in the chain, log and return error status.
      .mapErr((error) => {
        logger.error({
          message: 'Error verifying contact verification OTP',
          meta: {
            action: 'handleContactVerifyOtp',
            userId,
          },
          error,
        })

        const { errorMessage, statusCode } = mapRouteError(error)
        return res.status(statusCode).send(errorMessage)
      })
  )
}

/**
 * Retrieves and returns the session user from the database.
 * @route GET /
 * @returns 200 with the retrieved user if session user is valid
 * @returns 401 if user is not currently logged in
 * @returns 500 when user cannot be found or database errors occurs
 */
export const handleFetchUser: RequestHandler = async (req, res) => {
  const sessionUserId = getUserIdFromSession(req.session)
  if (!sessionUserId) {
    return res.status(StatusCodes.UNAUTHORIZED).send('User is unauthorized.')
  }

  return getPopulatedUserById(sessionUserId)
    .map((retrievedUser) => {
      return res.send(retrievedUser)
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error occurred whilst retrieving user',
        meta: {
          action: 'handleFetchUser',
          userId: sessionUserId,
        },
        error,
      })

      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).send(errorMessage)
    })
}

// TODO(#212): Save userId instead of entire user collection in session.
const getUserIdFromSession = (session?: Express.Session) => {
  return session?.user?._id as string | undefined
}
