import { parsePhoneNumberFromString } from 'libphonenumber-js/mobile'
import { Model, Mongoose, Schema } from 'mongoose'

import { IAdminVerificationSchema } from 'src/types/admin_verification'

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
  },
  {
    timestamps: {
      updatedAt: false,
    },
  },
)
AdminVerificationSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

const compileAdminVerificationModel = (db: Mongoose) =>
  db.model<IAdminVerificationSchema>(
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
    return db.model(ADMIN_VERIFICATION_SCHEMA_ID) as Model<
      IAdminVerificationSchema
    >
  } catch {
    return compileAdminVerificationModel(db)
  }
}

export default getAdminVerificationModel
