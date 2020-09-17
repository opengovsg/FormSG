import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import validator from 'validator'

import { IAgencySchema, ITokenSchema } from 'src/types'

import config from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import { LINKS } from '../../../shared/constants'
import getAgencyModel from '../../models/agency.server.model'
import getTokenModel from '../../models/token.server.model'
import { generateOtp } from '../../utils/otp'
import { ApplicationError, DatabaseError } from '../core/core.errors'

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
 * @returns ok(the agency document) with the domain of the email if the domain is valid
 * @returns err(InvalidDomainError) if the agency document cannot be found
 * @returns err(DatabaseError) if database query fails
 */
export const validateEmailDomain = (
  email: string,
): ResultAsync<IAgencySchema, InvalidDomainError | DatabaseError> => {
  // Extra guard even if Joi validation has already checked.
  if (!validator.isEmail(email)) {
    return errAsync(new InvalidDomainError())
  }

  const emailDomain = email.split('@').pop()
  return ResultAsync.fromPromise(
    AgencyModel.findOne({ emailDomain }).exec(),
    (error) => {
      logger.error({
        message: 'Database error when retrieving agency',
        meta: {
          action: 'validateEmailDomain',
          emailDomain,
        },
        error,
      })

      return new DatabaseError(
        `Unable to validate email domain. If this issue persists, please submit a Support Form at (${LINKS.supportFormLink})`,
      )
    },
  ).andThen((agency) => {
    if (!agency) {
      const noAgencyError = new InvalidDomainError()
      logger.warn({
        message: 'Agency not found',
        meta: {
          action: 'retrieveAgency',
          emailDomain,
        },
        error: noAgencyError,
      })
      return errAsync(noAgencyError)
    }
    return okAsync(agency)
  })
}

/**
 * Creates a login OTP and saves its hash into the Token collection.
 * @param email the email to link the generated otp to
 * @returns ok(the generated OTP) if saving into DB is successful
 * @returns err(InvalidDomainError) if the given email is invalid
 * @returns err(ApplicationError) if any error occur whilst hashing the OTP
 * @returns err(DatabaseError) if error occurs during upsertion of hashed OTP into the database.
 */
export const createLoginOtp = (
  email: string,
): ResultAsync<
  string,
  ApplicationError | DatabaseError | InvalidDomainError
> => {
  if (!validator.isEmail(email)) {
    return errAsync(new InvalidDomainError())
  }

  const otp = generateOtp()

  return (
    // Step 1: Hash OTP.
    hashOtp(otp, { email })
      // Step 2: Upsert otp hash into database.
      .andThen((hashedOtp) => upsertOtp(email, hashedOtp))
      // Step 3: Return generated OTP.
      .map(() => otp)
  )
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

// Private helper functions
/**
 * Hashes the given otp.
 * @param otpToHash the otp to hash
 * @param logMeta additional metadata for logging, if available
 * @returns ok(hashed otp) if the hashing was successful
 * @returns err(ApplicationError) if hashing error occurs
 */
const hashOtp = (otpToHash: string, logMeta: Record<string, unknown> = {}) => {
  return ResultAsync.fromPromise(
    bcrypt.hash(otpToHash, DEFAULT_SALT_ROUNDS),
    (error) => {
      logger.error({
        message: 'bcrypt hash otp error',
        meta: {
          action: 'hashOtp',
          ...logMeta,
        },
        error,
      })

      return new ApplicationError()
    },
  )
}

/**
 * Upserts the given otp hash into the document keyed by the given email
 * @param email the email to retrieve the current Token document for
 * @param hashedOtp the otp hash to upsert
 * @returns ok(upserted Token document) if upsert is successful
 * @returns err(DatabaseError) if upsert fails
 */
const upsertOtp = (
  email: string,
  hashedOtp: string,
): ResultAsync<ITokenSchema, DatabaseError> => {
  return ResultAsync.fromPromise(
    TokenModel.upsertOtp({
      email,
      hashedOtp,
      expireAt: new Date(Date.now() + config.otpLifeSpan),
    }),
    (error) => {
      logger.error({
        message: 'Database upsert OTP error',
        meta: {
          action: 'upsertOtp',
          email,
        },
        error,
      })

      return new DatabaseError()
    },
  )
}
