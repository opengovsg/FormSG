import to from 'await-to-js'
import { RequestHandler } from 'express'
import HttpStatus from 'http-status-codes'

import {
  createContactOtp,
  sendContactOtp,
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
    await sendContactOtp(generatedOtp, contact)
  } catch (err) {
    // Send different error messages according to error.
    return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  }

  return res.sendStatus(HttpStatus.OK)
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
