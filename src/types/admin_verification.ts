import { Document } from 'mongoose'

import { IUserSchema } from './user'

export interface IAdminVerification {
  admin: IUserSchema['_id']
  contact: string
  hashedOtp: string
  expireAt: Date
  numOtpAttempts: number
  numOtpSent: number
  _id?: Document['_id']
}

export interface IAdminVerificationSchema extends IAdminVerification, Document {
  _id: Document['_id']
}
