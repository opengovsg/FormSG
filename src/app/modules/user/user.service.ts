import to from 'await-to-js'
import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { errAsync, ResultAsync } from 'neverthrow'
import validator from 'validator'

import getAdminVerificationModel from '../../../app/models/admin_verification.server.model'
import { AGENCY_SCHEMA_ID } from '../../../app/models/agency.server.model'
import getUserModel from '../../../app/models/user.server.model'
import { generateOtp } from '../../../app/utils/otp'
import config from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import { IAgency, IPopulatedUser, IUserSchema } from '../../../types'
import { InvalidDomainError } from '../auth/auth.errors'
import { DatabaseError } from '../core/core.errors'

import { InvalidOtpError, MalformedOtpError } from './user.errors'

const logger = createLoggerWithLabel(module)

const AdminVerificationModel = getAdminVerificationModel(mongoose)
const UserModel = getUserModel(mongoose)

const DEFAULT_SALT_ROUNDS = 10
export const MAX_OTP_ATTEMPTS = 10

/**
 * Creates a contact OTP and saves it into the AdminVerification collection.
 * @param userId the user ID the contact is to be linked to
 * @param contact the contact number to send the generated OTP to
 * @returns the generated OTP if saving into DB is successful
 * @throws error if any error occur whilst creating the OTP or insertion of OTP into the database.
 */
export const createContactOtp = async (
  userId: IUserSchema['_id'],
  contact: string,
): Promise<string> => {
  // Verify existence of userId
  const admin = await UserModel.findById(userId)
  if (!admin) {
    throw new Error('User id is invalid')
  }

  const otp = generateOtp()
  const hashedOtp = await bcrypt.hash(otp, DEFAULT_SALT_ROUNDS)
  const hashedContact = await bcrypt.hash(contact, DEFAULT_SALT_ROUNDS)

  await AdminVerificationModel.upsertOtp({
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
 * returned. Else, the document is kept in the database and an error is thrown.
 * @param otpToVerify the OTP to verify with the hashed counterpart
 * @param contactToVerify the contact number to verify with the hashed counterpart
 * @param userId the id of the user used to retrieve the verification document from the database
 * @returns true on success
 * @throws HashMismatchError if hashes do not match, or any other errors that may occur.
 */
export const verifyContactOtp = async (
  otpToVerify: string,
  contactToVerify: string,
  userId: IUserSchema['_id'],
) => {
  const updatedDocument = await AdminVerificationModel.incrementAttemptsByAdminId(
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
    throw new MalformedOtpError(undefined, `bcrypt error for ${userId}`)
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
  await AdminVerificationModel.findOneAndRemove({ admin: userId })
  // Finally return true (as success).
  return true
}

/**
 * Updates the user document with the userId with the given contact and returns
 * the populated updated user.
 * @param contact the contact to update
 * @param userId the user id of the user document to update
 * @returns the updated user with populated references
 * @throws error if any db actions fail
 */
export const updateUserContact = async (
  contact: string,
  userId: IUserSchema['_id'],
): Promise<IPopulatedUser> => {
  // Retrieve user from database.
  // Update user's contact details.
  const admin = await UserModel.findById(userId).populate({
    path: 'agency',
    model: AGENCY_SCHEMA_ID,
  })
  if (!admin) {
    throw new Error('User id is invalid')
  }

  admin.contact = contact
  admin.updatedAt = new Date()
  return admin.save()
}

export const getPopulatedUserById = async (
  userId: IUserSchema['_id'],
): Promise<IPopulatedUser | null> => {
  return UserModel.findById(userId).populate({
    path: 'agency',
    model: AGENCY_SCHEMA_ID,
  })
}

/**
 * Retrieves the user with the given email. If the user does not yet exist, a
 * new user document is created and returned.
 * @param email the email of the user to retrieve
 * @param agency the agency document to associate with the user
 * @returns ok(upserted user document) populated with agency details
 * @returns err(InvalidDomainError) when given email is invalid
 * @returns err(DatabaseError) on upsert failure
 */
export const retrieveUser = (
  email: string,
  agencyId: IAgency['_id'],
): ResultAsync<IPopulatedUser, InvalidDomainError | DatabaseError> => {
  if (!validator.isEmail(email)) {
    return errAsync(new InvalidDomainError())
  }

  return ResultAsync.fromPromise(
    UserModel.upsertUser({
      email,
      agency: agencyId,
      lastAccessed: new Date(),
    }),
    (error) => {
      logger.error({
        message: 'Database error when upserting user',
        meta: {
          action: 'retrieveUser',
          email,
          agencyId,
        },
        error,
      })

      return new DatabaseError()
    },
  )
}
