import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { err, ok, Result } from 'neverthrow'
import validator from 'validator'

import { IAgencySchema } from 'src/types'

import config from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import { LINKS } from '../../../shared/constants'
import getAgencyModel from '../../models/agency.server.model'
import getTokenModel from '../../models/token.server.model'
import { generateOtp } from '../../utils/otp'
import { DatabaseError } from '../core/core.errors'

import { InvalidDomainError, InvalidOtpError } from './auth.errors'

const logger = createLoggerWithLabel(module)
const TokenModel = getTokenModel(mongoose)
const AgencyModel = getAgencyModel(mongoose)

const DEFAULT_SALT_ROUNDS = 10
export const MAX_OTP_ATTEMPTS = 10

/**
 * Validates the domain of the given email. A domain is valid if it exists in
 * the Agency collection in the database.
 * @param email the email to validate the domain for
 * @returns ok(agency) the agency document for the domain of the email only if it is valid
 * @returns err(InvalidDomainError) if the email domain is invalid or if the domain does not exist in any agency
 * @returns err(DatabaseError) if error occurs whilst retrieving agency from database
 */
export const validateEmailDomain = async (
  email: string,
): Promise<Result<IAgencySchema, InvalidDomainError | DatabaseError>> => {
  // Extra guard even if Joi validation has already checked.
  if (!validator.isEmail(email)) {
    return err(new InvalidDomainError())
  }

  const emailDomain = email.split('@').pop()

  try {
    const agency = await AgencyModel.findOne({ emailDomain })
    if (!agency) {
      return err(new InvalidDomainError())
    }

    return ok(agency)
  } catch (err) {
    logger.error({
      message: 'DB error whilst retrieving Agency',
      meta: {
        action: 'validateEmailDomain',
        emailDomain,
      },
      error: err as Error,
    })

    return err(
      new DatabaseError(
        `Unable to validate email domain. If this issue persists, please submit a Support Form at (${LINKS.supportFormLink}).`,
      ),
    )
  }
}

/**
 * Creates a login OTP and saves its hash into the Token collection.
 * @param email the email to link the generated otp to
 * @returns the generated OTP if saving into DB is successful
 * @throws {InvalidDomainError} the given email is invalid
 * @throws {Error} if any error occur whilst creating the OTP or insertion of OTP into the database.
 */
export const createLoginOtp = async (email: string) => {
  if (!validator.isEmail(email)) {
    throw new InvalidDomainError()
  }

  const otp = generateOtp()
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
  if (updatedDocument.numOtpAttempts! > MAX_OTP_ATTEMPTS) {
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
