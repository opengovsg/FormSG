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

  // Step 1: Create OTP for contact verification.
  const createResult = await createContactOtp(userId, contact)

  // Error creating OTP.
  if (createResult.isErr()) {
    const { error } = createResult
    logger.error({
      message: 'Error creating contact verification OTP',
      meta: logMeta,
      error,
    })
    const { errorMessage, statusCode } = mapRouteError(error)
    return res.status(statusCode).send(errorMessage)
  }

  // Step 2: No error, send verification OTP to contact.
  const otp = createResult.value
  const sendOtpResult = await SmsFactory.sendAdminContactOtp(
    contact,
    otp,
    userId,
  )

  // Error sending OTP.
  if (sendOtpResult.isErr()) {
    logger.error({
      message: 'Error sending contact verification OTP',
      meta: logMeta,
      error: sendOtpResult.error,
    })

    return res
      .status(StatusCodes.UNPROCESSABLE_ENTITY)
      .send('Failed to send emergency contact verification SMS')
  }

  // No errors, successfully sent SMS, return success to client.
  logger.info({
    message: 'Contact verification OTP sent successfully',
    meta: logMeta,
  })
  return res.sendStatus(StatusCodes.OK)
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

  const logMeta = {
    action: 'handleContactVerifyOtp',
    userId,
    ip: getRequestIp(req),
  }

  // Step 1: Verify contact and otp of user matches with stored hash.
  const verifyResult = await verifyContactOtp(otp, contact, userId)

  if (verifyResult.isErr()) {
    const { error } = verifyResult
    logger.error({
      message: 'Error verifying contact verification OTP',
      meta: logMeta,
      error,
    })

    const { errorMessage, statusCode } = mapRouteError(error)
    return res.status(statusCode).send(errorMessage)
  }

  // Step 2: Contact and OTP hashes match, update user with new contact.
  const updateResult = await updateUserContact(contact, userId)
  if (updateResult.isErr()) {
    const { error } = updateResult
    logger.error({
      message: 'Error updating user emergency contact number',
      meta: logMeta,
      error,
    })

    const { errorMessage, statusCode } = mapRouteError(error)
    return res.status(statusCode).send(errorMessage)
  }

  // No errors, return updated user to client.
  return res.status(StatusCodes.OK).send(updateResult.value)
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
    .map((retrievedUser) => res.send(retrievedUser))
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
