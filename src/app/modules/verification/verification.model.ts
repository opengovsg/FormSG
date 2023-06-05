import { pick } from 'lodash'
import { Mongoose, Schema } from 'mongoose'

import { PAYMENT_CONTACT_FIELD_ID } from '../../../../shared/constants'
import {
  BasicField,
  FormPaymentsField,
  FormResponseMode,
} from '../../../../shared/types'
import { TRANSACTION_EXPIRE_AFTER_SECONDS } from '../../../../shared/utils/verification'
import {
  FormFieldSchema,
  IEncryptedFormSchema,
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
    isPayment: boolean,
    fieldId: string,
  ): IVerificationFieldSchema | undefined {
    if (isPayment) {
      return this.paymentField
    } else {
      return this.fields.find((field) => field._id === fieldId)
    }
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

  const getVerifiableFormFields = (formFields?: FormFieldSchema[]) => {
    if (!formFields) return null
    const fields = extractTransactionFields(formFields)
    if (fields.length === 0) return null
    return fields
  }

  const getVerifiablePaymentContactField = (
    paymentsField?: FormPaymentsField,
  ) => {
    if (!paymentsField?.enabled) return null
    return {
      _id: PAYMENT_CONTACT_FIELD_ID,
      fieldType: BasicField.Email,
    }
  }

  const getVerificationPrefix = (isPayment: boolean) => {
    return isPayment ? 'paymentField' : 'fields.$'
  }

  VerificationSchema.statics.createTransactionFromForm = async function (
    form: IFormSchema | IEncryptedFormSchema,
  ): Promise<IVerificationSchema | null> {
    const formFields = getVerifiableFormFields(form.form_fields)
    if (form.responseMode === FormResponseMode.Encrypt) {
      const { payments_field } = form as IEncryptedFormSchema
      const paymentField = getVerifiablePaymentContactField(payments_field)
      if (!formFields && !paymentField) return null
      return this.create({
        formId: form._id,
        fields: formFields ?? [],
        paymentField,
      })
    } else {
      if (!formFields) return null
      return this.create({
        formId: form._id,
        fields: formFields,
      })
    }
  }

  VerificationSchema.statics.incrementFieldRetries = async function (
    transactionId: string,
    isPayment: boolean,
    fieldId: string,
  ): Promise<IVerificationSchema | null> {
    const operationPrefix = getVerificationPrefix(isPayment)
    return this.findOneAndUpdate(
      {
        _id: transactionId,
        ...(!isPayment && { 'fields._id': fieldId }),
      },
      {
        $inc: {
          [`${operationPrefix}.hashRetries`]: 1,
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
    isPayment: boolean,
    fieldId: string,
  ): Promise<IVerificationSchema | null> {
    const operationPrefix = getVerificationPrefix(isPayment)
    return this.findOneAndUpdate(
      {
        _id: transactionId,
        ...(!isPayment && { 'fields._id': fieldId }),
      },
      {
        $set: {
          [`${operationPrefix}.hashCreatedAt`]: null,
          [`${operationPrefix}.hashedOtp`]: null,
          [`${operationPrefix}.signedData`]: null,
          [`${operationPrefix}.hashRetries`]: 0,
        },
      },
      {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).exec()
  }

  VerificationSchema.statics.updateHashForField = async function (
    updateData: UpdateFieldData,
  ): Promise<IVerificationSchema | null> {
    const operationPrefix = getVerificationPrefix(updateData.isPayment)
    return this.findOneAndUpdate(
      {
        _id: updateData.transactionId,
        ...(!updateData.isPayment && { 'fields._id': updateData.fieldId }),
      },
      {
        $set: {
          [`${operationPrefix}.hashCreatedAt`]: new Date(),
          [`${operationPrefix}.hashedOtp`]: updateData.hashedOtp,
          [`${operationPrefix}.signedData`]: updateData.signedData,
          [`${operationPrefix}.hashRetries`]: 0,
        },
        $inc: {
          [`${operationPrefix}.otpRequests`]: 1,
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
