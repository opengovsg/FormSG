import { Document, Model } from 'mongoose'

import { IUserSchema } from './user'

export interface IAdminVerification {
  admin: IUserSchema['_id']
  hashedContact: string
  hashedOtp: string
  expireAt: Date
  numOtpAttempts?: number
  numOtpSent?: number
}

export interface IAdminVerificationSchema extends IAdminVerification, Document {
  createdAt?: Date
  updatedAt?: Date
}

// Fully created document with defaults populated.
export interface IAdminVerificationDoc extends IAdminVerificationSchema {
  createdAt: Date
  updatedAt: Date
  numOtpAttempts: number
  numOtpSent: number
}

export type UpsertOtpParams = Pick<
  IAdminVerificationSchema,
  'hashedOtp' | 'hashedContact' | 'admin' | 'expireAt'
>
export interface IAdminVerificationModel
  extends Model<IAdminVerificationSchema> {
  upsertOtp: (params: UpsertOtpParams) => Promise<IAdminVerificationSchema>
  incrementAttemptsByAdminId: (
    adminId: IUserSchema['_id'],
  ) => Promise<IAdminVerificationDoc>
}
