import { Document, Model } from 'mongoose'

import { IUserSchema } from './user'

export interface IAdminVerification {
  admin: IUserSchema['_id']
  hashedContact: string
  hashedOtp: string
  expireAt: Date
  numOtpAttempts?: number
  numOtpSent?: number
  _id?: Document['_id']
}

export interface IAdminVerificationSchema extends IAdminVerification, Document {
  _id: Document['_id']
}

export type UpsertOtpParams = Pick<
  IAdminVerificationSchema,
  'hashedOtp' | 'hashedContact' | 'admin' | 'expireAt'
>
export interface IAdminVerificationModel
  extends Model<IAdminVerificationSchema> {
  upsertOtp: (params: UpsertOtpParams) => Promise<IAdminVerificationSchema>
  incrementAttemptsByAdminId: (
    adminId: string,
  ) => Promise<IAdminVerificationSchema>
}
