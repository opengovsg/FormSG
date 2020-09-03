import { Document, Model } from 'mongoose'

import { IAgencySchema } from './agency'

export type AdminContactOtpData = {
  admin: IUserSchema['_id']
}

export interface IUser {
  email: string
  agency: IAgencySchema['_id']
  contact?: string
  created?: Date
  betaFlag?: Record<string, never>
  _id?: Document['_id']
}

export interface IUserSchema extends IUser, Document {
  _id: Document['_id']
}

export interface IUserModel extends Model<IUserSchema> {
  upsertUser: (
    upsertParams: Pick<IUser, 'email' | 'agency'>,
  ) => Promise<IUserSchema>
}

export interface IPopulatedUser extends IUserSchema {
  agency: IAgencySchema
}
