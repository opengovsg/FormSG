import { StatusCodes } from 'http-status-codes'

import {
  SendUserContactOtpDto,
  VerifyUserContactOtpDto,
} from '../../../../shared/types'
import { IPopulatedUser } from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import { SmsFactory } from '../../services/sms/sms.factory'
import { getRequestIp } from '../../utils/request'
import { getUserIdFromSession } from '../auth/auth.utils'
import { ControllerHandler } from '../core/core.types'

import { UNAUTHORIZED_USER_MESSAGE } from './user.constant'
import {
  validateContactOtpVerificationParams,
  validateContactSendOtpParams,
  validateUpdateUserLastSeenFeatureUpdateVersion,
} from './user.middleware'
import {
  createContactOtp,
  getPopulatedUserById,
  updateUserContact,
  updateUserLastSeenFeatureUpdateVersion,
  verifyContactOtp,
} from './user.service'
import { mapRouteError } from './user.utils'

const logger = createLoggerWithLabel(module)

export const _handleContactSendOtp: ControllerHandler<
  unknown,
  string,
  SendUserContactOtpDto
> = async (req, res) => {
  // Joi validation ensures existence.
  const { contact, userId } = req.body
  const sessionUserId = getUserIdFromSession(req.session)

  // Guard against user updating for a different user, or if user is not logged
  // in.
  if (!sessionUserId || sessionUserId !== userId) {
    return res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_USER_MESSAGE)
  }

  const senderIp = getRequestIp(req)

  const logMeta = {
    action: 'handleContactSendOtp',
    userId,
    ip: senderIp,
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
    return res.status(statusCode).json(errorMessage)
  }

  // Step 2: No error, send verification OTP to contact.
  const otp = createResult.value
  const sendOtpResult = await SmsFactory.sendAdminContactOtp(
    contact,
    otp,
    userId,
    senderIp,
  )

  // Error sending OTP.
  if (sendOtpResult.isErr()) {
    logger.error({
      message: 'Error sending contact verification OTP',
      meta: logMeta,
      error: sendOtpResult.error,
    })

    const { statusCode, errorMessage } = mapRouteError(sendOtpResult.error)

    return res.status(statusCode).json(errorMessage)
  }

  // No errors, successfully sent SMS, return success to client.
  logger.info({
    message: 'Contact verification OTP sent successfully',
    meta: logMeta,
  })
  return res.sendStatus(StatusCodes.OK)
}

/**
 * Generates an OTP and sends the OTP to the given contact in request body.
 * @route POST /contact/otp/generate
 * @returns 200 if OTP was successfully sent
 * @returns 401 if user id does not match current session user or if user is not currently logged in
 * @returns 422 on OTP creation or SMS send failure
 * @returns 422 if user id does not exist in the database
 * @returns 500 if database errors occurs
 */
export const handleContactSendOtp = [
  validateContactSendOtpParams,
  _handleContactSendOtp,
] as ControllerHandler[]

export const _handleContactVerifyOtp: ControllerHandler<
  unknown,
  string | IPopulatedUser,
  VerifyUserContactOtpDto
> = async (req, res) => {
  // Joi validation ensures existence.
  const { userId, otp, contact } = req.body
  const sessionUserId = getUserIdFromSession(req.session)

  // Guard against user updating for a different user, or if user is not logged
  // in.
  if (!sessionUserId || sessionUserId !== userId) {
    return res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_USER_MESSAGE)
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
    return res.status(statusCode).json(errorMessage)
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
    return res.status(statusCode).json(errorMessage)
  }

  // No errors, return updated user to client.
  return res.status(StatusCodes.OK).json(updateResult.value)
}

/**
 * Verifies given OTP with the hashed OTP data, and updates the user's contact
 * number if the hash matches.
 * @route POST /contact/otp/verify
 * @returns 200 when user contact update success
 * @returns 401 if user id does not match current session user or if user is not currently logged in
 * @returns 422 when OTP is invalid
 * @returns 500 when OTP is malformed or for unknown errors
 */
export const handleContactVerifyOtp = [
  validateContactOtpVerificationParams,
  _handleContactVerifyOtp,
] as ControllerHandler[]

/**
 * Retrieves and returns the session user from the database.
 * @route GET /
 * @returns 200 with the retrieved user if session user is valid
 * @returns 401 if user is not currently logged in
 * @returns 422 when user id does not exist in the database
 * @returns 500 database errors occurs
 */
export const handleFetchUser: ControllerHandler = async (req, res) => {
  const sessionUserId = getUserIdFromSession(req.session)
  if (!sessionUserId) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: UNAUTHORIZED_USER_MESSAGE })
  }

  return getPopulatedUserById(sessionUserId)
    .map((retrievedUser) => res.json(retrievedUser))
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
      return res.status(statusCode).json({ message: errorMessage })
    })
}

/**
 * @route POST /flag/last-seen
 * @returns 200 when user last seen feature update date update success
 * @returns 401 if user is not currently logged in
 * @returns 422 when user id does not exist in the database
 * @returns 500 database errors occurs
 */
export const _handleUpdateUserLastSeenFeatureUpdateVersion: ControllerHandler<
  unknown,
  IPopulatedUser | string,
  { version: number }
> = async (req, res) => {
  const sessionUserId = getUserIdFromSession(req.session)

  if (!sessionUserId) {
    return res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_USER_MESSAGE)
  }

  const { version } = req.body

  return updateUserLastSeenFeatureUpdateVersion(sessionUserId, version)
    .map((updatedUser) => {
      return res.status(StatusCodes.OK).json(updatedUser)
    })
    .mapErr((error) => {
      logger.error({
        message:
          'Error occurred while updating user last seen feature update date',
        meta: {
          action: 'handleUpdateUserLastSeenFeatureUpdate',
          userId: sessionUserId,
        },
        error,
      })

      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json(errorMessage)
    })
}

export const handleUpdateUserLastSeenFeatureUpdateVersion = [
  validateUpdateUserLastSeenFeatureUpdateVersion,
  _handleUpdateUserLastSeenFeatureUpdateVersion,
] as ControllerHandler[]
