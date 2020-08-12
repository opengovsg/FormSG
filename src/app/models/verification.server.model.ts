import { DocumentQuery, Model, Mongoose, Schema } from 'mongoose'

import * as vfnConstants from '../../shared/util/verification'
import { IVerificationFieldSchema, IVerificationSchema } from '../../types'

import { FORM_SCHEMA_ID } from './form.server.model'

const { getExpiryDate } = vfnConstants
const VERIFICATION_SCHEMA_ID = 'Verification'

interface IVerificationModel extends Model<IVerificationSchema> {
  findTransactionMetadata(
    id: IVerificationSchema['_id'],
  ): DocumentQuery<
    Pick<IVerificationSchema, 'formId' | 'expireAt'>,
    IVerificationSchema
  >
}

const VerificationFieldSchema = new Schema<IVerificationFieldSchema>({
  _id: {
    type: String,
    required: true,
  },
  fieldType: { type: String, required: true },
  signedData: { type: String, default: null },
  hashedOtp: { type: String, default: null },
  // No ttl index is applied on hashCreatedAt, as we do not want to delete the
  // entire document when a hash expires.
  hashCreatedAt: { type: Date, default: null },
  hashRetries: { type: Number, default: 0 },
})

const compileVerificationModel = (db: Mongoose) => {
  const VerificationSchema = new Schema<IVerificationSchema>({
    formId: {
      type: Schema.Types.ObjectId,
      ref: FORM_SCHEMA_ID,
      required: true,
    },
    expireAt: {
      type: Date,
      default: () =>
        getExpiryDate(vfnConstants.TRANSACTION_EXPIRE_AFTER_SECONDS),
    },
    fields: {
      type: [VerificationFieldSchema],
      default: [],
    },
  })

  // Index
  // Causes transaction to expire
  VerificationSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

  // Validator to make sure each field in a transaction has a different id
  VerificationSchema.pre<IVerificationSchema>('validate', function (next) {
    const fieldIds = this.fields.map((field) => field._id)
    if (fieldIds.length !== new Set(fieldIds).size) {
      return next(
        new Error('No duplicate field ids allowed for the same transaction'),
      )
    }

    return next()
  })

  // Static methods
  // Method to return non-sensitive fields
  VerificationSchema.statics.findTransactionMetadata = function (
    this: IVerificationModel,
    id: IVerificationSchema['_id'],
  ) {
    return this.findById(id, 'formId expireAt')
  }

  const VerificationModel = db.model<IVerificationSchema, IVerificationModel>(
    VERIFICATION_SCHEMA_ID,
    VerificationSchema,
  )

  return VerificationModel
}

/**
 * Retrieves the Verification model on the given Mongoose instance. If the model
 * is not registered yet, the model will be registered and returned.
 * @param db The mongoose instance to retrieve the Verification model from
 * @returns The Verification model
 */
const getVerificationModel = (db: Mongoose) => {
  try {
    return db.model(VERIFICATION_SCHEMA_ID) as IVerificationModel
  } catch {
    return compileVerificationModel(db)
  }
}

export default getVerificationModel
