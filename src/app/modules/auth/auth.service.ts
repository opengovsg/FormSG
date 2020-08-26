import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import validator from 'validator'

import getTokenModel from 'src/app/models/token.server.model'

import config, { otpGenerator } from '../../../config/config'
import getAgencyModel from '../../models/agency.server.model'

import { InvalidDomainError, InvalidOtpError } from './auth.errors'

const TokenModel = getTokenModel(mongoose)
const AgencyModel = getAgencyModel(mongoose)

const DEFAULT_SALT_ROUNDS = 10
const MAX_OTP_ATTEMPTS = 10

/**
 * Validates the domain of the given email. A domain is valid if it exists in
 * the Agency collection in the database.
 * @param email the email to validate the domain for
 * @returns the agency document with the domain of the email only if it is valid.
 * @throws error if database query fails or if agency cannot be found.
 */
export const getAgencyWithEmail = async (email: string) => {
  // Extra guard even if Joi validation has already checked.
  if (!validator.isEmail(email)) {
    throw new InvalidDomainError()
  }

  const emailDomain = email.split('@').pop()
  const agency = await AgencyModel.findOne({ emailDomain })
  if (!agency) {
    throw new InvalidDomainError()
  }

  return agency
}

export const createLoginOtp = async (email: string) => {
  if (!validator.isEmail(email)) {
    throw new InvalidDomainError()
  }

  const otp = otpGenerator()
  const hashedOtp = await bcrypt.hash(otp, DEFAULT_SALT_ROUNDS)

  await TokenModel.upsertOtp({
    email,
    hashedOtp,
    expireAt: new Date(Date.now() + config.otpLifeSpan),
  })

  return otp
}

/**
 * Compares the given otp with their hashed counterparts in the database to be
 * retrieved with the given email.
 *
 * If the hash matches, the saved document in the database is removed and
 * returned. Else, the document is kept in the database and an error is thrown.
 * @param otpToVerify the OTP to verify with the hashed counterpart
 * @param email the email used to retrieve the document from the database
 * @returns true on success
 * @throws {InvalidOtpError} if the OTP is invalid or expired.
 * @throws {Error} if any errors occur whilst retrieving from database or comparing hashes.
 */
export const verifyLoginOtp = async (otpToVerify: string, email: string) => {
  const updatedDocument = await TokenModel.incrementAttemptsByEmail(email)

  // Does not exist, return expired error message.
  if (!updatedDocument) {
    throw new InvalidOtpError('OTP has expired. Please request for a new OTP.')
  }

  // Too many attempts.
  if (updatedDocument.numOtpAttempts > MAX_OTP_ATTEMPTS) {
    throw new InvalidOtpError(
      'You have hit the max number of attempts. Please request for a new OTP.',
    )
  }

  // Compare otp with saved hash.
  const isOtpMatch = await bcrypt.compare(
    otpToVerify,
    updatedDocument.hashedOtp,
  )

  if (!isOtpMatch) {
    throw new InvalidOtpError('OTP is invalid. Please try again.')
  }

  // Hashed OTP matches, remove from collection.
  await TokenModel.findOneAndRemove({ email })
  // Finally return true (as success).
  return true
}
