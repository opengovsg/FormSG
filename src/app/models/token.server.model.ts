import { Model, Mongoose, Schema } from 'mongoose'

import { ITokenSchema } from '../../types'

export const TOKEN_SCHEMA_ID = 'Token'

const TokenSchema = new Schema<ITokenSchema>({
  email: {
    type: String,
  },
  hashedOtp: {
    type: String,
  },
  expireAt: {
    type: Date,
  },
  numOtpAttempts: {
    type: Number,
    default: 0,
  },
  numOtpSent: {
    type: Number,
    default: 0,
  },
})
TokenSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

/**
 * Token Schema
 * @param db - Active DB Connection
 * @returns Token model
 */
const getTokenModel = (db: Mongoose) => {
  try {
    return db.model(TOKEN_SCHEMA_ID) as Model<ITokenSchema>
  } catch {
    return db.model<ITokenSchema>(TOKEN_SCHEMA_ID, TokenSchema)
  }
}

export default getTokenModel
