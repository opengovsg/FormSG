import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import validator from 'validator'

import { IAgencySchema, ITokenSchema } from 'src/types'

import config from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import { LINKS } from '../../../shared/constants'
import getAgencyModel from '../../models/agency.server.model'
import getTokenModel from '../../models/token.server.model'
import { hashData } from '../../utils/hash'
import { generateOtp } from '../../utils/otp'
import { ApplicationError, DatabaseError } from '../core/core.errors'

import { InvalidDomainError, InvalidOtpError } from './auth.errors'

const logger = createLoggerWithLabel(module)
const TokenModel = getTokenModel(mongoose)
const AgencyModel = getAgencyModel(mongoose)

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
    hashData(otp, { email })
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
 * @returns ok(true) on success
 * @returns err(InvalidOtpError) if the OTP is invalid or expired
 * @returns err(ApplicationError) if any error occurs whilst comparing hashes
 * @returns err(DatabaseError) if any errors occur whilst querying the database
 */
export const verifyLoginOtp = (
  otpToVerify: string,
  email: string,
): ResultAsync<true, InvalidOtpError | DatabaseError | ApplicationError> => {
  return (
    // Step 1: Increment login attempts.
    incrementLoginAttempts(email)
      // Step 2: Compare otp with saved hash.
      .andThen(({ hashedOtp }) => compareOtpHash(otpToVerify, hashedOtp))
      // Step 3: Remove token document from collection since hash matches.
      .andThen(() => removeTokenOnSuccess(email))
      // Step 4: Return true (as success).
      .map(() => true)
  )
}

// Private helper functions

/**
 * Compares otp with a given hash.
 * @param otpToVerify The unhashed OTP to check match for
 * @param hashedOtp The hashed OTP to check match for
 * @param logMeta additional metadata for logging, if available
 * @returns ok(true) if the hash matches
 * @returns err(ApplicationError) if error occurs whilst comparing hashes
 * @returns err(InvalidOtpError) if OTP hashes do not match
 */
const compareOtpHash = (
  otpToVerify: string,
  hashedOtp: string,
  logMeta: Record<string, unknown> = {},
): ResultAsync<true, ApplicationError | InvalidOtpError> => {
  return ResultAsync.fromPromise(
    bcrypt.compare(otpToVerify, hashedOtp),
    (error) => {
      logger.error({
        message: 'bcrypt compare otp error',
        meta: {
          action: 'compareHash',
          ...logMeta,
        },
        error,
      })

      return new ApplicationError()
    },
  ).andThen((isOtpMatch) => {
    if (!isOtpMatch) {
      return errAsync(new InvalidOtpError('OTP is invalid. Please try again.'))
    }

    return okAsync(isOtpMatch)
  })
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

/**
 * Increment login attempts for the given email
 * @param email the email to increment login attempts for
 * @returns ok(updated document) if increment succeeds
 * @returns err(DatabaseError) if any database error occurs whilst updating attempts
 * @returns err(InvalidOtpError) if login has expired or if max number of attempts are reached
 */
const incrementLoginAttempts = (
  email: string,
): ResultAsync<ITokenSchema, InvalidOtpError | DatabaseError> => {
  return ResultAsync.fromPromise(
    TokenModel.incrementAttemptsByEmail(email),
    (error) => {
      logger.error({
        message: 'Database increment OTP error',
        meta: {
          action: 'incrementAttempts',
          email,
        },
        error,
      })

      return new DatabaseError()
    },
  ).andThen((upsertedDoc) => {
    // Document does not exist, return expired error message.
    if (!upsertedDoc || !upsertedDoc.numOtpAttempts) {
      return errAsync(
        new InvalidOtpError('OTP has expired. Please request for a new OTP.'),
      )
    }
    if (upsertedDoc.numOtpAttempts > MAX_OTP_ATTEMPTS) {
      return errAsync(
        new InvalidOtpError(
          'You have hit the max number of attempts. Please request for a new OTP.',
        ),
      )
    }

    return okAsync(upsertedDoc)
  })
}

const removeTokenOnSuccess = (email: string) => {
  return ResultAsync.fromPromise(
    TokenModel.findOneAndRemove({ email }).exec(),
    (error) => {
      logger.error({
        message: 'Database remove Token document error',
        meta: {
          action: 'removeTokenOnSuccess',
          email,
        },
        error,
      })

      return new DatabaseError()
    },
  )
}
