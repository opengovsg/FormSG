import mongoose from 'mongoose'
import validator from 'validator'

import { IAgency, IUserSchema } from '../../../types'
import getUserModel from '../../models/user.server.model'
import { InvalidDomainError } from '../auth/auth.errors'

const UserModel = getUserModel(mongoose)

/**
 * Updates or creates a user document with the given email and return the user.
 * @param email the email of the user to retrieve
 * @param agency the agency document to associate with the user
 * @returns the upserted user document
 * @throws {InvalidDomainError} on invalid email
 * @throws {Error} on upsert failure
 */
export const upsertAndReturnUser = async (email: string, agency: IAgency) => {
  if (!validator.isEmail(email)) {
    throw new InvalidDomainError()
  }

  const upsertParams: Partial<IUserSchema> = {
    email,
    agency: agency._id,
  }

  const admin = await UserModel.findOneAndUpdate(
    { email },
    { $set: upsertParams },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  )
  if (!admin) {
    throw new Error('Failed to upsert user')
  }

  return admin
}
