import { parsePhoneNumberFromString } from 'libphonenumber-js/mobile'
import { Mongoose, Schema } from 'mongoose'

import {
  IAdminVerificationModel,
  IAdminVerificationSchema,
  UpsertOtpParams,
} from 'src/types/admin_verification'

export const ADMIN_VERIFICATION_SCHEMA_ID = 'AdminVerification'

const AdminVerificationSchema = new Schema<IAdminVerificationSchema>(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: 'AdminVerificationSchema must have an Admin',
    },
    contact: {
      type: String,
      required: true,
      validate: {
        // Check if phone number is valid.
        validator: function (value: string) {
          const phoneNumber = parsePhoneNumberFromString(value)
          if (!phoneNumber) return false
          return phoneNumber.isValid()
        },
        message: (props) => `${props.value} is not a valid mobile number`,
      },
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
    timestamps: {
      updatedAt: false,
    },
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
    { $set: upsertParams },
    { upsert: true, new: true },
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
