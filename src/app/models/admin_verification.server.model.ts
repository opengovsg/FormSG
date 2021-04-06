import { Mongoose, Schema } from 'mongoose'

import { IUserSchema } from 'src/types'

import {
  IAdminVerificationModel,
  IAdminVerificationSchema,
  UpsertOtpParams,
} from '../../types'

import { USER_SCHEMA_ID } from './user.server.model'

export const ADMIN_VERIFICATION_SCHEMA_ID = 'AdminVerification'

const AdminVerificationSchema = new Schema<
  IAdminVerificationSchema,
  IAdminVerificationModel
>(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: USER_SCHEMA_ID,
      required: 'AdminVerificationSchema must have an Admin',
    },
    hashedContact: {
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
  },
  {
    timestamps: true,
  },
)
AdminVerificationSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

// Statics
/**
 * Upserts given OTP into AdminVerification collection.
 */
AdminVerificationSchema.statics.upsertOtp = async function (
  this: IAdminVerificationModel,
  upsertParams: UpsertOtpParams,
) {
  return this.findOneAndUpdate(
    { admin: upsertParams.admin },
    {
      $set: { ...upsertParams, numOtpAttempts: 0 },
      $inc: { numOtpSent: 1 },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  )
}

/**
 * Increments otp attempts for the given admin id.
 * @param adminId the admin id to increment otp attempts for
 * @returns the incremented document
 */
AdminVerificationSchema.statics.incrementAttemptsByAdminId = async function (
  this: IAdminVerificationModel,
  adminId: IUserSchema['_id'],
) {
  return this.findOneAndUpdate(
    { admin: adminId },
    { $inc: { numOtpAttempts: 1 } },
    { new: true },
  )
}

const compileAdminVerificationModel = (db: Mongoose) =>
  db.model<IAdminVerificationSchema, IAdminVerificationModel>(
    ADMIN_VERIFICATION_SCHEMA_ID,
    AdminVerificationSchema,
  )

/**
 * Retrieves the AdminVerification model on the given Mongoose instance. If the
 * model is not registered yet, the model will be registered and returned.
 * @param db The mongoose instance to retrieve the AdminVerification model from
 * @returns The agency model
 */
const getAdminVerificationModel = (db: Mongoose) => {
  try {
    return db.model(ADMIN_VERIFICATION_SCHEMA_ID) as IAdminVerificationModel
  } catch {
    return compileAdminVerificationModel(db)
  }
}

export default getAdminVerificationModel
