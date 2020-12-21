import { Document, Model, ObjectId } from 'mongoose'

import { IAgencySchema, PublicAgency } from './agency'

export type PublicUser = {
  agency: PublicAgency | ObjectId
}

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

export interface IUserSchema extends IUser, Document {
  created?: Date

  /**
   * Returns the public view of the user document.
   */
  getPublicView(): PublicUser
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
}

export interface IPopulatedUser extends IUserSchema {
  agency: IAgencySchema
}
