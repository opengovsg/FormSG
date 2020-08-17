import to from 'await-to-js'
import { RequestHandler } from 'express'
import HttpStatus from 'http-status-codes'

import SmsFactory from '../../factories/sms.factory'

import {
  createContactOtp,
  updateUserContact,
  verifyContactOtp,
} from './user.service'

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
    // Send different error messages according to error.
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

  const [verifyErr] = await to(verifyContactOtp(otp, contact, userId))
  if (verifyErr) {
    // Handle vfn error
    return
  }

  // No error, update user with given contact.
  const [updateErr] = await to(updateUserContact(contact, userId))
  if (updateErr) {
    // Handle update error
  }

  return res.sendStatus(HttpStatus.OK)
}
