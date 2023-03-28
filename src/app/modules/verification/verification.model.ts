import { pick } from 'lodash'
import { Mongoose, Schema } from 'mongoose'

import { PAYMENT_CONTACT_FIELD_ID } from '../../../../shared/constants'
import { BasicField } from '../../../../shared/types'
import { TRANSACTION_EXPIRE_AFTER_SECONDS } from '../../../../shared/utils/verification'
import {
  IFormSchema,
  IVerificationFieldSchema,
  IVerificationModel,
  IVerificationSchema,
  PublicTransaction,
  UpdateFormFieldData,
  UpdatePaymentFieldData,
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
  fieldType: { type: String, enum: Object.values(BasicField), required: true },
  signedData: { type: String, default: null },
  hashedOtp: { type: String, default: null },
  // No ttl index is applied on hashCreatedAt, as we do not want to delete the
  // entire document when a hash expires.
  hashCreatedAt: { type: Date, default: null },
  // Number of retries attempted for a given OTP
  hashRetries: { type: Number, default: 0 },
  // Number of OTPs requested for this field
  otpRequests: { type: Number, default: 0 },
})

const compileVerificationModel = (db: Mongoose): IVerificationModel => {
  const VerificationSchema = new Schema<
    IVerificationSchema,
    IVerificationModel
  >({
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
    paymentField: {
      type: VerificationFieldSchema,
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
  VerificationSchema.methods.getPublicView = function (): PublicTransaction {
    return pick(this, VERIFICATION_PUBLIC_FIELDS) as PublicTransaction
  }

  VerificationSchema.methods.getField = function (
    fieldId: string,
  ): IVerificationFieldSchema | undefined {
    return this.fields.find((field) => field._id === fieldId)
  }

  VerificationSchema.methods.getPaymentContactField = function ():
    | IVerificationFieldSchema
    | undefined {
    return this.paymentField
  }

  // Static methods
  // Method to return non-sensitive fields
  VerificationSchema.statics.getPublicViewById = async function (
    id: IVerificationSchema['_id'],
  ): Promise<PublicTransaction | null> {
    const document = await this.findById(id)
    if (!document) return null
    return document.getPublicView()
  }

  VerificationSchema.statics.createTransactionFromForm = async function (
    form: IFormSchema,
  ): Promise<IVerificationSchema | null> {
    const { form_fields, payments_field } = form
    if (
      !form_fields &&
      (payments_field == undefined || !payments_field.enabled)
    )
      return null
    let fields, paymentField
    if (form_fields) {
      fields = extractTransactionFields(form_fields)
    }
    if (payments_field?.enabled) {
      paymentField = { _id: PAYMENT_CONTACT_FIELD_ID, fieldType: 'email' }
    }
    return this.create({
      formId: form._id,
      fields,
      paymentField,
    })
  }

  VerificationSchema.statics.incrementFieldRetries = async function (
    transactionId: string,
    fieldId: string,
  ): Promise<IVerificationSchema | null> {
    return this.findOneAndUpdate(
      {
        _id: transactionId,
        'fields._id': fieldId,
      },
      {
        $inc: {
          'fields.$.hashRetries': 1,
        },
      },
      {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).exec()
  }

  VerificationSchema.statics.resetField = async function (
    transactionId: string,
    fieldId: string,
  ): Promise<IVerificationSchema | null> {
    return this.findOneAndUpdate(
      {
        _id: transactionId,
        'fields._id': fieldId,
      },
      {
        $set: {
          'fields.$.hashCreatedAt': null,
          'fields.$.hashedOtp': null,
          'fields.$.signedData': null,
          'fields.$.hashRetries': 0,
        },
      },
      {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).exec()
  }

  VerificationSchema.statics.updateHashForFormField = async function (
    updateData: UpdateFormFieldData,
  ): Promise<IVerificationSchema | null> {
    return this.findOneAndUpdate(
      {
        _id: updateData.transactionId,
        'fields._id': updateData.fieldId,
      },
      {
        $set: {
          'fields.$.hashCreatedAt': new Date(),
          'fields.$.hashedOtp': updateData.hashedOtp,
          'fields.$.signedData': updateData.signedData,
          'fields.$.hashRetries': 0,
        },
        $inc: {
          'fields.$.otpRequests': 1,
        },
      },
      {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).exec()
  }

  VerificationSchema.statics.updateHashForPaymentField = async function (
    updateData: UpdatePaymentFieldData,
  ): Promise<IVerificationSchema | null> {
    return this.findOneAndUpdate(
      {
        _id: updateData.transactionId,
      },
      {
        $set: {
          'paymentField.hashCreatedAt': new Date(),
          'paymentField.hashedOtp': updateData.hashedOtp,
          'paymentField.signedData': updateData.signedData,
          'paymentField.hashRetries': 0,
        },
        $inc: {
          'paymentField.otpRequests': 1,
        },
      },
      {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).exec()
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
