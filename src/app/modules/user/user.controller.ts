import to from 'await-to-js'
import { RequestHandler } from 'express'
import HttpStatus from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import SmsFactory from '../../factories/sms.factory'
import { ApplicationError } from '../core/core.errors'

import {
  createContactOtp,
  updateUserContact,
  verifyContactOtp,
} from './user.service'

const logger = createLoggerWithLabel('user-controller')

export const handleContactSendOtp: RequestHandler<
  {},
  {},
  { contact: string; userId: string }
> = async (req, res) => {
  const { contact, userId } = req.body

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
  const { userId, otp, contact } = req.body

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
  const [updateErr] = await to(updateUserContact(contact, userId))
  if (updateErr) {
    // Handle update error
  }

  return res.sendStatus(HttpStatus.OK)
}
