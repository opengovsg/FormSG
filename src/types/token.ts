import { Document } from 'mongoose'

export interface IToken {
  email: string
  hashedOtp: string
  expireAt: Date
  numOtpAttempts: number
  numOtpSent: number
  _id: Document['_id']
}

export interface ITokenSchema extends IToken, Document {}
