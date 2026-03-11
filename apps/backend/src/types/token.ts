import { Document, Model } from 'mongoose'

export interface IToken {
  email: string
  hashedOtp: string
  expireAt: Date
  numOtpAttempts?: number
  numOtpSent?: number
}

export interface ITokenSchema extends IToken, Document {}

export interface ITokenModel extends Model<ITokenSchema> {
  upsertOtp: (
    params: Omit<IToken, '_id' | 'numOtpSent'>,
  ) => Promise<ITokenSchema>

  incrementAttemptsByEmail: (
    email: IToken['email'],
  ) => Promise<ITokenSchema | null>
}
