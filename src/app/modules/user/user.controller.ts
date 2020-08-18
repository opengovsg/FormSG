import to from 'await-to-js'
import { RequestHandler } from 'express'
import HttpStatus from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import SmsFactory from '../../factories/sms.factory'
import { ApplicationError } from '../core/core.errors'

import {
  createContactOtp,
  getPopulatedUserById,
  updateUserContact,
  verifyContactOtp,
} from './user.service'

const logger = createLoggerWithLabel('user-controller')

export const handleContactSendOtp: RequestHandler<
  {},
  {},
  { contact: string; userId: string }
> = async (req, res) => {
  // Joi validation ensures existence.
  const { contact, userId } = req.body
  const sessionUserId = getUserIdFromSession(req.session)

  // Guard against user updating for a different user, or if user is not logged
  // in.
  if (!sessionUserId || sessionUserId !== userId) {
    return res.status(HttpStatus.UNAUTHORIZED).send('User is unauthorized.')
  }

  try {
    const generatedOtp = await createContactOtp(userId, contact)
    await SmsFactory.sendAdminContactOtp(contact, generatedOtp, userId)

    return res.sendStatus(HttpStatus.OK)
  } catch (err) {
    // TODO: Send different error messages according to error.
    return res.status(HttpStatus.BAD_REQUEST).send(err.message)
  }
}

export const handleContactVerifyOtp: RequestHandler<
  {},
  {},
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
    return res.status(HttpStatus.UNAUTHORIZED).send('User is unauthorized.')
  }

  try {
    await verifyContactOtp(otp, contact, userId)
  } catch (err) {
    logger.warn(err.meta ?? err)
    if (err instanceof ApplicationError) {
      return res.status(err.status).send(err.message)
    } else {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err.message)
    }
  }

  // No error, update user with given contact.
  const [updateErr, updatedUser] = await to(updateUserContact(contact, userId))
  if (updateErr) {
    // Handle update error.
    logger.warn(updateErr)
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(updateErr.message)
  }

  return res.status(HttpStatus.OK).send(updatedUser)
}

export const handleFetchUser: RequestHandler = async (req, res) => {
  const sessionUserId = getUserIdFromSession(req.session)
  if (!sessionUserId) {
    return res.status(HttpStatus.UNAUTHORIZED).send('User is unauthorized.')
  }

  // Retrieve user with id in session
  const [dbErr, retrievedUser] = await to(getPopulatedUserById(sessionUserId))

  if (dbErr || !retrievedUser) {
    logger.warn(
      `handleFetchUser: Unable to retrieve user ${sessionUserId}`,
      dbErr,
    )
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send('Unable to retrieve user')
  }

  return res.send(retrievedUser)
}

// TODO: Save userId instead of entire user collection in session.
const getUserIdFromSession = (session?: Express.Session) => {
  return session?.user?._id as string | undefined
}
