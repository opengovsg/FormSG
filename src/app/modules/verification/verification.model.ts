import { pick } from 'lodash'
import { Mongoose, Schema } from 'mongoose'

import { TRANSACTION_EXPIRE_AFTER_SECONDS } from '../../../shared/util/verification'
import {
  IFormSchema,
  IVerificationFieldSchema,
  IVerificationModel,
  IVerificationSchema,
  PublicTransaction,
  UpdateFieldData,
} from '../../../types'
import { FORM_SCHEMA_ID } from '../../models/form.server.model'

import { extractTransactionFields, getExpiryDate } from './verification.util'

const VERIFICATION_SCHEMA_ID = 'Verification'

export const VERIFICATION_PUBLIC_FIELDS = ['formId', 'expireAt', '_id']

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

const compileVerificationModel = (db: Mongoose): IVerificationModel => {
  const VerificationSchema = new Schema<IVerificationSchema>({
    formId: {
      type: Schema.Types.ObjectId,
      ref: FORM_SCHEMA_ID,
      required: true,
    },
    expireAt: {
      type: Date,
      default: () => getExpiryDate(TRANSACTION_EXPIRE_AFTER_SECONDS),
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

  // Instance methods
  VerificationSchema.methods.getPublicView = function (
    this: IVerificationSchema,
  ): PublicTransaction {
    return pick(this, VERIFICATION_PUBLIC_FIELDS) as PublicTransaction
  }

  VerificationSchema.methods.getField = function (
    this: IVerificationSchema,
    fieldId: string,
  ): IVerificationFieldSchema | undefined {
    return this.fields.find((field) => field._id === fieldId)
  }

  VerificationSchema.methods.updateDataForField = async function (
    this: IVerificationSchema,
    updateData: UpdateFieldData,
  ): Promise<IVerificationSchema | null> {
    const field = this.getField(updateData.fieldId)
    if (!field) return null

    if (updateData.hashCreatedAt !== undefined) {
      field.hashCreatedAt = updateData.hashCreatedAt
    }
    if (updateData.hashRetries !== undefined) {
      field.hashRetries = updateData.hashRetries
    }
    if (updateData.hashedOtp !== undefined) {
      field.hashedOtp = updateData.hashedOtp
    }
    if (updateData.signedData !== undefined) {
      field.signedData = updateData.signedData
    }
    return this.save()
  }

  VerificationSchema.methods.incrementFieldRetries = async function (
    this: IVerificationSchema,
    fieldId: string,
  ): Promise<IVerificationSchema | null> {
    const field = this.getField(fieldId)
    if (!field) return null
    field.hashRetries = (field.hashRetries ?? 0) + 1
    return this.save()
  }

  VerificationSchema.methods.resetField = async function (
    this: IVerificationSchema,
    fieldId: string,
  ): Promise<IVerificationSchema | null> {
    return this.updateDataForField({
      fieldId,
      hashCreatedAt: null,
      hashedOtp: null,
      signedData: null,
      hashRetries: 0,
    })
  }

  // Static methods
  // Method to return non-sensitive fields
  VerificationSchema.statics.getPublicViewById = async function (
    this: IVerificationModel,
    id: IVerificationSchema['_id'],
  ): Promise<PublicTransaction | null> {
    const document = await this.findById(id)
    if (!document) return null
    return document.getPublicView()
  }

  VerificationSchema.statics.createTransactionFromForm = async function (
    this: IVerificationModel,
    form: IFormSchema,
  ): Promise<IVerificationSchema | null> {
    const { form_fields } = form
    if (!form_fields) return null
    const fields = extractTransactionFields(form_fields)
    if (fields.length === 0) return null
    return this.create({
      formId: form._id,
      fields,
    })
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
const getVerificationModel = (db: Mongoose): IVerificationModel => {
  try {
    return db.model(VERIFICATION_SCHEMA_ID) as IVerificationModel
  } catch {
    return compileVerificationModel(db)
  }
}

export default getVerificationModel
