import bcrypt from 'bcrypt'
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import * as TE from 'fp-ts/lib/TaskEither'
import mongoose from 'mongoose'
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
 * @returns ok(agency) the agency document for the domain of the email only if it is valid
 * @returns err(InvalidDomainError) if the email domain is invalid or if the domain does not exist in any agency
 * @returns err(DatabaseError) if error occurs whilst retrieving agency from database
 */
export const validateEmailDomain = (
  email: string,
): TE.TaskEither<InvalidDomainError | DatabaseError, IAgencySchema> => {
  // Extra guard even if Joi validation has already checked.
  if (!validator.isEmail(email)) {
    return TE.left(new InvalidDomainError())
  }

  const emailDomain = email.split('@').pop()

  return pipe(
    TE.tryCatch(
      () => AgencyModel.findOne({ emailDomain }).exec(),
      (err) => {
        logger.error({
          message: 'DB error whilst retrieving Agency',
          meta: {
            action: 'validateEmailDomain',
            emailDomain,
          },
          error: err as Error,
        })
        return new DatabaseError(
          `Unable to validate email domain. If this issue persists, please submit a Support Form at (${LINKS.supportFormLink}).`,
        )
      },
    ),
    TE.chain((agency) => {
      if (!agency) {
        logger.warn({
          message: 'Agency not found',
          meta: {
            action: 'validateEmailDomain',
            emailDomain,
          },
        })
        return TE.left(new InvalidDomainError())
      }
      return TE.right(agency)
    }),
  )
}

/**
 * Creates a login OTP and saves its hash into the Token collection.
 * @param email the email to link the generated otp to
 * @returns the generated OTP if saving into DB is successful
 * @throws {InvalidDomainError} the given email is invalid
 * @throws {Error} if any error occur whilst creating the OTP or insertion of OTP into the database.
 */
export const createLoginOtp = (
  email: string,
): TE.TaskEither<DatabaseError, string> => {
  if (!validator.isEmail(email)) {
    return TE.left(new InvalidDomainError())
  }

  const otp = generateOtp()

  const upsertToken = (
    email: string,
    hashedOtp: string,
  ): TE.TaskEither<DatabaseError, ITokenSchema> => {
    return TE.tryCatch(
      () =>
        TokenModel.upsertOtp({
          email,
          hashedOtp,
          expireAt: new Date(Date.now() + config.otpLifeSpan),
        }),
      (err) => {
        logger.error({
          message: 'Error upserting login token',
          meta: {
            action: 'createLoginOtp',
          },
          error: err as Error,
        })
        return new DatabaseError()
      },
    )
  }

  return pipe(
    TE.tryCatch(() => bcrypt.hash(otp, DEFAULT_SALT_ROUNDS), E.toError),
    TE.chain((hashedOtp) => upsertToken(email, hashedOtp)),
    TE.map(() => otp),
  )
}

/**
 * Compares the given otp with their hashed counterparts in the database to be
 * retrieved with the given email.
 *
 * If the hash matches, the saved document in the database is removed and
 * `true` is returned. Else, the document is kept in the database and an error
 * is thrown.
 * @param otpToVerify the OTP to verify with the hashed counterpart
 * @param email the email used to retrieve the document from the database
 * @returns true on success
 * @throws {InvalidOtpError} if the OTP is invalid or expired.
 * @throws {ApplicationError} if any errors occur whilst comparing hashes.
 * @throws {DatabaseError} if any errors occur from database queries.
 */
export const verifyLoginOtp = (
  otpToVerify: string,
  email: string,
): TE.TaskEither<
  DatabaseError | InvalidOtpError | ApplicationError,
  boolean
> => {
  const incrementLoginAttempt = (): TE.TaskEither<
    DatabaseError | InvalidOtpError,
    ITokenSchema
  > =>
    pipe(
      TE.tryCatch(
        () => TokenModel.incrementAttemptsByEmail(email),
        (err) => {
          logger.error({
            message: `${err}`,
            meta: {
              action: 'verifyLoginOtp',
              email,
            },
            error: err,
          })
          return new DatabaseError()
        },
      ),
      TE.chain((upsertedToken) => {
        if (!upsertedToken) {
          return TE.left(
            new InvalidOtpError(
              'OTP has expired. Please request for a new OTP.',
            ),
          )
        }
        if (upsertedToken.numOtpAttempts > MAX_OTP_ATTEMPTS) {
          return TE.left(
            new InvalidOtpError(
              'You have hit the max number of attempts. Please request for a new OTP.',
            ),
          )
        }
        return TE.right(upsertedToken)
      }),
    )

  // Compare otp with saved hash.
  const compareHash = (
    hashedOtp: string,
  ): TE.TaskEither<ApplicationError, boolean> =>
    TE.tryCatch(
      () => bcrypt.compare(otpToVerify, hashedOtp),
      (err) => {
        logger.error({
          message: `Bcrypt failed to compare hash ${err}`,
          meta: {
            action: 'verifyLoginOtp',
            email,
          },
          error: err,
        })
        return new ApplicationError()
      },
    )

  const validateHash = (
    isOtpMatch: boolean,
  ): E.Either<InvalidOtpError, boolean> => {
    if (!isOtpMatch) {
      return E.left(new InvalidOtpError('OTP is invalid. Please try again.'))
    }
    return E.right(true)
  }

  const removeToken = (email: string) =>
    TE.tryCatch(
      () => TokenModel.findOneAndRemove({ email }).exec(),
      (err) => {
        logger.error({
          message: `${err}`,
          meta: {
            action: 'verifyLoginOtp',
            email,
          },
          error: err,
        })
        return new DatabaseError()
      },
    )

  return pipe(
    incrementLoginAttempt(),
    TE.chain(({ hashedOtp }) => compareHash(hashedOtp)),
    TE.chain((isHashMatch) => TE.fromEither(validateHash(isHashMatch))),
    TE.chain(() => removeToken(email)),
    TE.map(() => true),
  )
}
