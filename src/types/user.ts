import { Document, Model, Schema } from 'mongoose'
import type { SetOptional } from 'type-fest'

import { PublicAgencyDto, UserBase } from '../../shared/types'

import { AgencyDocument, IAgencySchema } from './agency'
import { PublicView } from './database'

export type PublicUser = {
  agency: PublicAgencyDto | Schema.Types.ObjectId
}

export type AdminContactOtpData = {
  admin: IUserSchema['_id']
}

export interface IUser
  extends SetOptional<UserBase, 'created' | 'lastAccessed' | 'updatedAt'> {
  agency: IAgencySchema['_id']
}

export type UserContactView = Pick<IUser, 'email' | 'contact'>

export interface IUserSchema extends IUser, Document, PublicView<PublicUser> {}

export type IUserSchemaWithoutApi = Omit<IUserSchema, 'apiToken'>

export type UserApiToken = {
  keyHash: string
  createdAt: Date
  lastUsedAt: Date
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

export interface IPopulatedUser extends Omit<IUserSchema, 'apiToken'> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _id: any
  agency: AgencyDocument
}

export interface IPopulatedApiUser extends IUserSchema {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _id: any
  agency: AgencyDocument
}
