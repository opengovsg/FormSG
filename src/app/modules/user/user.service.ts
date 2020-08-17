import to from 'await-to-js'
import bcrypt from 'bcrypt'
import mongoose from 'mongoose'

import getAdminVerificationModel from '../../../app/models/admin_verification.server.model'
import getUserModel from '../../../app/models/user.server.model'
import { generateOtp } from '../../../app/utils/otp'
import config from '../../../config/config'

import { InvalidOtpError, MalformedOtpError } from './user.errors'

const AdminVerification = getAdminVerificationModel(mongoose)
const User = getUserModel(mongoose)

const DEFAULT_SALT_ROUNDS = 10
const MAX_OTP_ATTEMPTS = 10

/**
 * Creates a contact OTP and saves it into the AdminVerification collection.
 * @param userId the user ID the contact is to be linked to
 * @param contact the contact number to send the generated OTP to
 * @returns the generated OTP if saving into DB is successful
 * @throws error if any error occur whilst creating the OTP or insertion of OTP into the database.
 */
export const createContactOtp = async (
  userId: string,
  contact: string,
): Promise<string> => {
  // Verify existence of userId
  const admin = await User.findById(userId)
  if (!admin) {
    throw new Error('User id is invalid')
  }

  const otp = generateOtp()
  const hashedOtp = await bcrypt.hash(otp, DEFAULT_SALT_ROUNDS)
  const hashedContact = await bcrypt.hash(contact, DEFAULT_SALT_ROUNDS)

  await AdminVerification.upsertOtp({
    admin: userId,
    expireAt: new Date(Date.now() + config.otpLifeSpan),
    hashedContact,
    hashedOtp,
  })

  return otp
}

/**
 * Compares the otpToVerify and contact number with their hashed counterparts in
 * the database to be retrieved with the userId.
 *
 * If the both hashes matches, the saved document in the database is removed and
 * returned. Else, the document is kept in the database and a HashMismatchError is thrown.
 * @param otpToVerify the OTP to verify with the hashed counterpart
 * @param contactToVerify the contact number to verify with the hashed counterpart
 * @param userId the id of the user used to retrieve the verification document from the database
 * @returns true on success
 * @throws HashMismatchError if hashes do not match, or any other errors that may occur.
 */
export const verifyContactOtp = async (
  otpToVerify: string,
  contactToVerify: string,
  userId: string,
) => {
  const updatedDocument = await AdminVerification.incrementAttemptsByAdminId(
    userId,
  )

  // Does not exist, return expired error message.
  if (!updatedDocument) {
    throw new InvalidOtpError(
      'OTP has expired. Please request for a new OTP.',
      `OTP for ${userId} not found in AdminVerification collection.`,
    )
  }

  // Too many attempts.
  if (updatedDocument.numOtpAttempts > MAX_OTP_ATTEMPTS) {
    throw new InvalidOtpError(
      'You have hit the max number of attempts. Please request for a new OTP.',
      `${userId} exceeded max OTP attempts`,
    )
  }

  // Compare contact number with saved hash.
  const [contactHashErr, isContactMatch] = await to(
    bcrypt.compare(contactToVerify, updatedDocument.hashedContact),
  )

  // Compare otp with saved hash.
  const [otpHashError, isOtpMatch] = await to(
    bcrypt.compare(otpToVerify, updatedDocument.hashedOtp),
  )

  if (contactHashErr || otpHashError) {
    throw new MalformedOtpError(null, `bcrypt error for ${userId}`)
  }

  if (!isOtpMatch) {
    throw new InvalidOtpError(
      'OTP is invalid. Please try again.',
      `Invalid OTP attempted for ${userId}`,
    )
  }

  if (!isContactMatch) {
    throw new InvalidOtpError(
      'Contact number given does not match the number the OTP is sent to. Please try again with the correct contact number.',
      `Invalid contact number for ${userId}`,
    )
  }

  // Hashed OTP matches, remove from collection.
  await AdminVerification.findOneAndRemove({ admin: userId })
  // Finally return true (as success).
  return true
}

/**
 * Updates the user document with the userId with the given contact.
 * @param contact the contact to update
 * @param userId the user id of the user document to update
 */
export const updateUserContact = async (contact: string, userId: string) => {
  // Retrieve user from database.
  // Update user's contact details.
}
