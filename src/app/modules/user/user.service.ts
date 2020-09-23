import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import validator from 'validator'

import getAdminVerificationModel from '../../../app/models/admin_verification.server.model'
import { AGENCY_SCHEMA_ID } from '../../../app/models/agency.server.model'
import getUserModel from '../../../app/models/user.server.model'
import config from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import {
  IAdminVerificationDoc,
  IAgency,
  IPopulatedUser,
  IUserSchema,
  UpsertOtpParams,
} from '../../../types'
import { compareData, hashData } from '../../utils/hash'
import { generateOtp } from '../../utils/otp'
import { InvalidDomainError } from '../auth/auth.errors'
import { ApplicationError, DatabaseError } from '../core/core.errors'

import { InvalidOtpError, MissingUserError } from './user.errors'

const logger = createLoggerWithLabel(module)

const AdminVerificationModel = getAdminVerificationModel(mongoose)
const UserModel = getUserModel(mongoose)

export const MAX_OTP_ATTEMPTS = 10

/**
 * Creates a contact OTP and saves it into the AdminVerification collection.
 * @param userId the user ID the contact is to be linked to
 * @param contact the contact number to send the generated OTP to
 * @returns ok(the generated OTP) if saving into DB is successful
 * @returns err(DatabaseError) if error occurs whilst insertion of OTP into the database
 * @returns err(ApplicationError) if error occurs whilst hashing the OTP or contact
 * @returns err(MissingUserError) if the user document cannot be retrieved with the user id
 */
export const createContactOtp = (
  userId: IUserSchema['_id'],
  contact: string,
): ResultAsync<string, ApplicationError | DatabaseError | MissingUserError> => {
  const otp = generateOtp()
  // Step 1: Verify existence of userId.
  return (
    findAdminById(userId)
      // Step 2: Hash OTP and contact number.
      .andThen(() => hashOtpAndContact(otp, contact))
      // Step 3: Upsert hashed data into database..
      .andThen(({ hashedOtp, hashedContact }) =>
        upsertContactOtp({
          admin: userId,
          expireAt: new Date(Date.now() + config.otpLifeSpan),
          hashedContact,
          hashedOtp,
        }),
      )
      // Step 4: Return generated OTP.
      .map(() => otp)
  )
}

/**
 * Compares the otpToVerify and contact number with their hashed counterparts in
 * the database to be retrieved with the userId.
 *
 * If the both hashes matches, the saved document in the database is removed and
 * returned. Else, the document is kept in the database and an error is
 * returned.
 * @param otpToVerify the OTP to verify with the hashed counterpart
 * @param contactToVerify the contact number to verify with the hashed counterpart
 * @param userId the id of the user used to retrieve the verification document from the database
 * @returns ok(true) on success
 * @returns err(MissingUserError) if the user document cannot be retrieved with the user id
 * @returns err(InvalidHashError) if any of the hashes do not match, or if the OTP has expired
 * @returns err(ApplicationError) if any errors occur whilst hashing
 * @returns err(DatabaseError) if any errors occur whilst performing database queries
 */
export const verifyContactOtp = (
  otpToVerify: string,
  contactToVerify: string,
  userId: IUserSchema['_id'],
): ResultAsync<
  true,
  MissingUserError | InvalidOtpError | DatabaseError | ApplicationError
> => {
  return (
    // Step 1: Verify existence of userId.
    findAdminById(userId)
      // Step 2: Increment OTP verification attempts.
      .andThen(() => incrementOtpAttempts(userId))
      // Step 3: Compare hashes of contact and OTP.
      .andThen(({ hashedContact, hashedOtp }) =>
        assertHashesMatch(
          otpToVerify,
          hashedOtp,
          contactToVerify,
          hashedContact,
        ),
      )
      // Step 4: Remove document from collection since hashes match.
      .andThen(() => removeAdminVerificationDoc(userId))
      // Step 5: Return true (as success).
      .map(() => true)
  )
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

// Private helper functions
/**
 * Retrieves the user with the given id.
 * @param userId the id of the user to retrieve
 * @returns ok(user document) if retrieval is successful
 * @returns err(DatabaseError) if database errors occurs whilst retrieving user
 * @returns err(MissingUserError) if user does not exist in the database
 */
const findAdminById = (
  userId: string,
): ResultAsync<IUserSchema, MissingUserError | DatabaseError> => {
  return ResultAsync.fromPromise(UserModel.findById(userId).exec(), (error) => {
    logger.error({
      message: 'Database find user error',
      meta: {
        action: 'findAdminById',
        userId,
      },
      error,
    })
    return new DatabaseError()
  }).andThen((admin) => {
    if (!admin) {
      return errAsync(new MissingUserError())
    }
    return okAsync(admin)
  })
}

/**
 * Hashes both the given otp and contact data.
 * @param otp the otp to hash
 * @param contact the contact to hash
 * @param logMeta additional metadata for logging, if available
 * @returns ok(hashed otp and contact) is no errors occur
 * @returns err(ApplicationError) if error occurs whilst hashing
 *
 */
const hashOtpAndContact = (
  otp: string,
  contact: string,
  logMeta?: Record<string, unknown>,
): ResultAsync<
  {
    hashedOtp: string
    hashedContact: string
  },
  ApplicationError
> => {
  return (
    // Step 1: Hash OTP.
    hashData(otp, logMeta)
      // Step 2: Hash contact.
      .andThen((hashedOtp) =>
        hashData(contact, logMeta)
          // If successful, return both hashedOtp and hashedContact.
          .map((hashedContact) => ({
            hashedOtp,
            hashedContact,
          })),
      )
  )
}

/**
 * Asserts that the otp and contact number matches with their respective hashes.
 * @param otp the otp to check match for
 * @param otpHash the hashed form of the otp to check match with
 * @param contact the contact to check match for
 * @param contactHash the hashed form of the contact to check match with
 * @param logMeta additional metadata for logging, if available
 * @returns ok(true) if both the hashes match
 * @returns err(ApplicationError) if error occurs whilst comparing hashes
 * @returns err(InvalidHashError) if the hashes do not match
 */
const assertHashesMatch = (
  otp: string,
  otpHash: string,
  contact: string,
  contactHash: string,
  logMeta: Record<string, unknown> = {},
): ResultAsync<true, ApplicationError | InvalidOtpError> => {
  // Compare OTP hashes first.
  return (
    compareData(otp, otpHash, logMeta)
      .andThen((isOtpMatch) => {
        if (isOtpMatch) return okAsync(true)
        return errAsync(
          new InvalidOtpError('OTP is invalid. Please try again.'),
        )
      })
      // Must be success match if reaches here.
      .andThen(() => compareData(contact, contactHash, logMeta))
      .andThen((isContactMatch) => {
        if (isContactMatch) return okAsync(true)
        return errAsync(
          new InvalidOtpError(
            'Contact number given does not match the number the OTP is sent to. Please try again with the correct contact number.',
          ),
        )
      })
  )
}

/**
 * Upserts the given params into the document keyed by params.admin
 * @param params the params to upsert into the document
 * @returns ok(upserted document) if upsert is successful
 * @returns err(DatabaseError) if upsert fails
 */
const upsertContactOtp = (params: UpsertOtpParams) => {
  return ResultAsync.fromPromise(
    AdminVerificationModel.upsertOtp(params),
    (error) => {
      logger.error({
        message: 'Database upsert contact OTP error',
        meta: {
          action: 'upsertContactOtp',
          userId: params.admin,
        },
        error,
      })

      return new DatabaseError()
    },
  )
}

/**
 * Increment otp verification attempts for the given user id.
 * @param userId the user to increment attempts for
 * @returns ok(updated document) if increment succeeds
 * @returns err(DatabaseError) if any database error occurs whilst updating attempts
 * @returns err(InvalidOtpError) if otp has expired or if max number of attempts are reached
 */
const incrementOtpAttempts = (
  userId: string,
): ResultAsync<IAdminVerificationDoc, InvalidOtpError | DatabaseError> => {
  return ResultAsync.fromPromise(
    AdminVerificationModel.incrementAttemptsByAdminId(userId),
    (error) => {
      logger.error({
        message: 'Database increment OTP attempt error',
        meta: {
          action: 'incrementOtpAttempts',
          userId,
        },
        error,
      })

      return new DatabaseError()
    },
  ).andThen((upsertedDoc) => {
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
 * Removes the admin verification document from the database
 * @param userId the userId of the document to remove
 * @returns ok(removed document) if removal is successful
 * @returns err(DatabaseError) if database error occurs whilst removing document
 */
const removeAdminVerificationDoc = (userId: string) => {
  return ResultAsync.fromPromise(
    AdminVerificationModel.findOneAndRemove({ admin: userId }).exec(),
    (error) => {
      logger.error({
        message: 'Database remove AdminVerification document error',
        meta: {
          action: 'removeAdminVerificationDoc',
          userId,
        },
        error,
      })

      return new DatabaseError()
    },
  )
}
