import { Document, Model } from 'mongoose'

export interface IToken {
  email: string
  hashedOtp: string
  expireAt: Date
  numOtpAttempts?: number
  numOtpSent?: number
  _id?: Document['_id']
}

export interface ITokenSchema extends IToken, Document {
  _id: Document['_id']
}

export interface ITokenModel extends Model<ITokenSchema> {
  upsertOtp: (
    params: Omit<IToken, '_id' | 'numOtpSent'>,
  ) => Promise<ITokenSchema>
}
