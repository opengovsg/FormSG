import { Mongoose, Schema } from 'mongoose'

import { IToken, ITokenModel, ITokenSchema } from 'src/types'

export const TOKEN_SCHEMA_ID = 'Token'

const TokenSchema = new Schema<ITokenSchema, ITokenModel>({
  email: {
    type: String,
    required: true,
  },
  hashedOtp: {
    type: String,
    required: true,
  },
  expireAt: {
    type: Date,
    required: true,
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

// Statics
/**
 * Upserts given OTP into Token collection.
 */
TokenSchema.statics.upsertOtp = async function (
  this: ITokenModel,
  upsertParams: Omit<IToken, '_id' | 'numOtpSent'>,
) {
  return this.findOneAndUpdate(
    { email: upsertParams.email },
    {
      $set: { ...upsertParams, numOtpAttempts: 0 },
      $inc: { numOtpSent: 1 },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  )
}

/**
 * Increments the number of login attempts for the document associated with the
 * given email.
 * @param email the email to retrieve the related Token document
 */
TokenSchema.statics.incrementAttemptsByEmail = async function (
  this: ITokenModel,
  email: string,
) {
  return this.findOneAndUpdate(
    { email: email },
    { $inc: { numOtpAttempts: 1 } },
    { new: true },
  )
}

/**
 * Token Schema
 * @param db - Active DB Connection
 * @returns Token model
 */
const getTokenModel = (db: Mongoose) => {
  try {
    return db.model(TOKEN_SCHEMA_ID) as ITokenModel
  } catch {
    return db.model<ITokenSchema, ITokenModel>(TOKEN_SCHEMA_ID, TokenSchema)
  }
}

export default getTokenModel
