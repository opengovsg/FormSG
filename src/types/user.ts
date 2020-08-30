import { Document } from 'mongoose'

import { IAgencySchema } from './agency'

export type AdminContactOtpData = {
  admin: IUserSchema['_id']
}

export interface IUser {
  email: string
  agency: IAgencySchema['_id']
  contact?: string
  created?: Date
  betaFlag?: {}
  _id?: Document['_id']
}

export interface IUserSchema extends IUser, Document {
  _id: Document['_id']
}

export interface IPopulatedUser extends IUserSchema {
  agency: IAgencySchema
}
