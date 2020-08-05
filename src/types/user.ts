import { Document } from 'mongoose'

import { IAgencySchema } from './agency'

export interface IUser {
  email: string
  agency: IAgencySchema['_id']
  created: Date
  betaFlag?: {
    allowSms?: boolean
  }
  _id: Document['_id']
}

export interface IUserSchema extends IUser, Document {}

export interface IPopulatedUser extends IUserSchema {
  agency: IAgencySchema
}
