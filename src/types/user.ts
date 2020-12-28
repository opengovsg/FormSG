import { Document, Model } from 'mongoose'

import { IAgencySchema } from './agency'

export type AdminContactOtpData = {
  admin: IUserSchema['_id']
}

export interface IUser {
  email: string
  agency: IAgencySchema['_id']
  contact?: string
  betaFlags?: Record<string, never>
  lastAccessed?: Date
  updatedAt?: Date
}

export type UserContactView = Pick<IUser, 'email' | 'contact'>

export interface IUserSchema extends IUser, Document {
  created?: Date
}

export interface IUserModel extends Model<IUserSchema> {
  /**
   * Upsert into User collection with given email and agencyId.
   * If user with given email does not exist, a new document will be created.
   * If user with given email already exists, the user's agency will be updated
   * and populated before being returned.
   * @returns the user document after upsert with populated agency details
   */
  upsertUser: (
    upsertParams: Pick<IUser, 'email' | 'agency' | 'lastAccessed'>,
  ) => Promise<IPopulatedUser>
  /**
   * Finds the contact numbers for all given email addresses which exist in the
   * User collection.
   * @param emails List of email addresses for which to find contact numbers
   * @returns List of contact numbers
   */
  findContactNumbersByEmails: (emails: string[]) => Promise<UserContactView[]>
}

export interface IPopulatedUser extends IUserSchema {
  agency: IAgencySchema
}
