import bcrypt from 'bcrypt'
import crypto from 'crypto'
import mongoose from 'mongoose'
import { errAsync, okAsync, Result, ResultAsync } from 'neverthrow'
import validator from 'validator'

import { SUPPORT_FORM_LINK } from '../../../../shared/constants/links'
import {
  AgencyDocument,
  IPopulatedForm,
  ITokenSchema,
  IUserSchema,
} from '../../../types'
import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import getAgencyModel from '../../models/agency.server.model'
import getTokenModel from '../../models/token.server.model'
import { compareHash, HashingError } from '../../utils/hash'
import { generateOtpWithHash } from '../../utils/otp'
import { DatabaseError } from '../core/core.errors'
import { PermissionLevel } from '../form/admin-form/admin-form.types'
import {
  assertFormAvailable,
  getAssertPermissionFn,
} from '../form/admin-form/admin-form.utils'
import {
  ForbiddenFormError,
  FormDeletedError,
  FormNotFoundError,
  PrivateFormError,
} from '../form/form.errors'
import * as FormService from '../form/form.service'
import { findUserById } from '../user/user.service'

import {
  InvalidDomainError,
  InvalidOtpError,
  InvalidTokenError,
  MissingTokenError,
} from './auth.errors'
import { DEFAULT_SALT_ROUNDS } from './constants'

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
): ResultAsync<AgencyDocument, InvalidDomainError | DatabaseError> => {
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
        `Unable to validate email domain. If this issue persists, please submit a Support Form at (${SUPPORT_FORM_LINK})`,
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
    return okAsync(agency as AgencyDocument)
  })
}

/**
 * Creates a login OTP and saves its hash into the Token collection.
 * @param email the email to link the generated otp to
 * @returns ok(the generated OTP) if saving into DB is successful
 * @returns err(InvalidDomainError) if the given email is invalid
 * @returns err(HashingError) if any error occur whilst hashing the OTP
 * @returns err(DatabaseError) if error occurs during upsertion of hashed OTP into the database.
 */
export const createLoginOtp = (
  email: string,
): ResultAsync<
  { otp: string; otpPrefix: string },
  HashingError | DatabaseError | InvalidDomainError
> => {
  if (!validator.isEmail(email)) {
    return errAsync(new InvalidDomainError())
  }

  return (
    // Step 1: Generate and hash OTP.
    generateOtpWithHash({ email })
      // Step 2: Upsert otp hash into database.
      .andThen(({ otp, hashedOtp, otpPrefix }) =>
        upsertOtp(email, hashedOtp)
          // Step 3: Return generated OTP.
          .map(() => {
            return { otp, otpPrefix }
          }),
      )
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
 * @returns err(HashingError) if any error occurs whilst comparing hashes
 * @returns err(DatabaseError) if any errors occur whilst querying the database
 */
export const verifyLoginOtp = (
  otpToVerify: string,
  email: string,
): ResultAsync<true, InvalidOtpError | DatabaseError | HashingError> => {
  return (
    // Step 1: Increment login attempts.
    incrementLoginAttempts(email)
      // Step 2: Compare otp with saved hash.
      .andThen(({ hashedOtp }) => assertHashMatch(otpToVerify, hashedOtp))
      // Step 3: Remove token document from collection since hash matches.
      .andThen(() => removeTokenOnSuccess(email))
      // Step 4: Return true (as success).
      .map(() => true)
  )
}

// Private helper functions
/**
 * Asserts that the otp matches with the given hash.
 * @param otp the otp to check match for
 * @param otpHash the hashed form of the otp to check match with
 * @param logMeta additional metadata for logging, if available
 * @returns ok(true) if the hash matches
 * @returns err(HashingError) if error occurs whilst comparing hashes
 * @returns err(InvalidOtpError) if the hashes do not match
 */
const assertHashMatch = (
  otp: string,
  otpHash: string,
  logMeta: Record<string, unknown> = {},
): ResultAsync<true, HashingError | InvalidOtpError> => {
  return compareHash(otp, otpHash, logMeta).andThen((isMatch) => {
    if (isMatch) return okAsync(isMatch)
    return errAsync(new InvalidOtpError('OTP is invalid. Please try again.'))
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
          action: 'incrementLoginAttempts',
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

/**
 * Removes token document from the database
 * @param email the email of the token document to remove
 * @returns ok(removed document) if removal is successful
 * @returns err(DatabaseError) if database error occurs whilst removing document
 */
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

/**
 * Retrieves the form of given formId provided that the given user has the
 * required permissions.
 *
 * @returns ok(form) if the user has the required permissions
 * @returns err(FormNotFoundError) if form does not exist in the database
 * @returns err(FormDeleteError) if form is already archived
 * @returns err(ForbiddenFormError if user does not have permission
 * @returns err(DatabaseError) if any database error occurs
 */
export const getFormAfterPermissionChecks = ({
  user,
  formId,
  level,
}: {
  user: IUserSchema
  formId: string
  level: PermissionLevel
}): ResultAsync<
  IPopulatedForm,
  FormNotFoundError | FormDeletedError | DatabaseError | ForbiddenFormError
> => {
  return FormService.retrieveFullFormById(formId)
    .map((form) => ({ form, user }))
    .andThen(checkFormForPermissions(level))
}

/**
 * Ensures that the given user has the required pre-specified permissions
 * for the form.
 *
 * @returns ok(form) if the user has the required permissions
 * @returns err(FormNotFoundError) if form does not exist in the database
 * @returns err(FormDeleteError) if form is already archived
 * @returns err(ForbiddenFormError if user does not have permission
 * @returns err(DatabaseError) if any database error occurs
 */
export const checkFormForPermissions =
  (level: PermissionLevel) =>
  ({
    user,
    form,
  }: {
    user: IUserSchema
    form: IPopulatedForm
  }): Result<IPopulatedForm, FormDeletedError | ForbiddenFormError> =>
    // Step 1: Check whether form is available to be retrieved.
    assertFormAvailable(form)
      // Step 2: Check required permission levels.
      .andThen(() => getAssertPermissionFn(level)(user, form))
      .map(() => form)

/**
 * Retrieves the form of given formId provided that the form is public.
 *
 * @returns ok(form) if the form is public
 * @returns err(FormNotFoundError) if form (or form admin) does not exist
 * @returns err(FormDeletedError) if form is already archived
 * @returns err(PrivateFormError) if form is private
 * @returns err(DatabaseError) if database error occurs
 */
export const getFormIfPublic = (
  formId: string,
): ResultAsync<
  IPopulatedForm,
  FormNotFoundError | FormDeletedError | PrivateFormError | DatabaseError
> => {
  return FormService.retrieveFullFormById(formId).andThen((form) =>
    FormService.isFormPublic(form).map(() => form),
  )
}

/**
 * Retrieves the user of the given API key
 *
 * @returns ok(IUserSchema) if the API key matches the hashed API key in the DB
 * @returns err(DatabaseError) if database errors occurs whilst retrieving user
 * @returns err(MissingUserError) if user does not exist in the database
 */
export const getUserByApiKey = (
  userId: string,
  token: string,
): ResultAsync<IUserSchema, Error> => {
  return findUserById(userId).andThen((user) => {
    if (!user.apiToken?.keyHash) {
      return errAsync(new MissingTokenError())
    }
    return compareHash(token, user.apiToken.keyHash).andThen((isHashMatch) => {
      if (isHashMatch) return okAsync(user)
      return errAsync(new InvalidTokenError())
    })
  })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getApiKeyHash = (apiKey: string): ResultAsync<string, HashingError> => {
  return ResultAsync.fromPromise(
    bcrypt.hash(apiKey, DEFAULT_SALT_ROUNDS),
    (error) => {
      logger.error({
        message: 'bcrypt hash error',
        meta: {
          action: 'getApiKeyHash',
        },
        error,
      })
      return new HashingError()
    },
  ).map((hash) => `${hash}`)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const generateApiKey = (user: IUserSchema): string => {
  const key = crypto.randomBytes(32).toString('base64')
  const apiEnv = config.publicApiConfig.apiEnv
  const apiKeyVersion = config.publicApiConfig.apiKeyVersion
  return `${apiEnv}_${apiKeyVersion}_${user._id}_${key}`
}
