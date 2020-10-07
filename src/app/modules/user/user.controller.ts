import to from 'await-to-js'
import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { IPopulatedUser } from '../../../types'
import { SmsFactory } from '../../services/sms/sms.factory'
import { ApplicationError } from '../core/core.errors'

import {
  createContactOtp,
  getPopulatedUserById,
  updateUserContact,
  verifyContactOtp,
} from './user.service'

const logger = createLoggerWithLabel(module)

/**
 * Generates an OTP and sends the OTP to the given contact in request body.
 * @route POST /contact/sendotp
 * @returns 200 if OTP was successfully sent
 * @returns 400 on OTP creation or SMS send failure
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

  try {
    const generatedOtp = await createContactOtp(userId, contact)
    await SmsFactory.sendAdminContactOtp(contact, generatedOtp, userId)

    return res.sendStatus(StatusCodes.OK)
  } catch (err) {
    // TODO(#193): Send different error messages according to error.
    return res.status(StatusCodes.BAD_REQUEST).send(err.message)
  }
}

/**
 * Verifies given OTP with the hashed OTP data, and updates the user's contact
 * number if the hash matches.
 * @route POST /contact/verifyotp
 * @returns 200 when user contact update success
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

  try {
    await verifyContactOtp(otp, contact, userId)
  } catch (err) {
    logger.warn({
      message: 'Error occurred whilst verifying contact OTP',
      meta: {
        action: 'handleContactVerifyOtp',
        userId,
      },
      error: err,
    })
    if (err instanceof ApplicationError) {
      return res.status(err.status).send(err.message)
    } else {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err.message)
    }
  }

  // No error, update user with given contact.
  try {
    const updatedUser = await updateUserContact(contact, userId)
    return res.status(StatusCodes.OK).json(updatedUser)
  } catch (updateErr) {
    // Handle update error.
    logger.warn({
      message: 'Error occurred whilst updating user contact',
      meta: {
        action: 'handleContactVerifyOtp',
        userId,
      },
      error: updateErr,
    })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(updateErr.message)
  }
}

export const handleFetchUser: RequestHandler = async (req, res) => {
  const sessionUserId = getUserIdFromSession(req.session)
  if (!sessionUserId) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: 'User is unauthorized.' })
  }

  // Retrieve user with id in session
  const [dbErr, retrievedUser] = await to(getPopulatedUserById(sessionUserId))

  if (dbErr || !retrievedUser) {
    logger.warn({
      message: `Unable to retrieve user ${sessionUserId}`,
      meta: {
        action: 'handleFetchUser',
        userId: sessionUserId,
      },
      error: dbErr ?? undefined,
    })
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Unable to retrieve user' })
  }

  return res.json(retrievedUser)
}

// TODO(#212): Save userId instead of entire user collection in session.
const getUserIdFromSession = (session?: Express.Session) => {
  return session?.user?._id as string | undefined
}
