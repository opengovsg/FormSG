import { Document, Model, ObjectId } from 'mongoose'

import { AgencyDocument, PublicAgency } from './agency'
import { PublicView } from './database'

export type PublicUser = {
  agency: PublicAgency | ObjectId
}

export type AdminContactOtpData = {
  admin: IUserSchema['_id']
}

export interface IUser {
  email: string
  agency: AgencyDocument['_id']
  contact?: string
  betaFlags?: {
    sgid?: boolean
  }
  lastAccessed?: Date
  updatedAt?: Date
}

export type UserContactView = Pick<IUser, 'email' | 'contact'>

export interface IUserSchema extends IUser, Document, PublicView<PublicUser> {
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
  agency: AgencyDocument
}
