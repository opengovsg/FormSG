import { Document, Model, Query } from 'mongoose'

import { IFormSchema } from './form'

export interface IVerificationField {
  fieldType: string
  signedData?: string | null
  hashedOtp?: string | null
  hashCreatedAt?: Date | null
  hashRetries?: number
}

export interface IVerificationFieldSchema
  extends IVerificationField,
    Document<string> {
  // _id is basically a generated transactionId, so it has to be a string,
  // instead of being converted to a string from ObjectId.
  // This must be a string, or transaction fetching will fail.
}

export interface IVerification {
  formId: IFormSchema['_id']
  expireAt?: Date
  fields: IVerificationFieldSchema[]
}

export interface IVerificationSchema extends IVerification, Document {}

export interface IVerificationModel extends Model<IVerificationSchema> {
  findTransactionMetadata(
    id: IVerificationSchema['_id'],
  ): Query<Omit<IVerificationSchema, 'fields'>, IVerificationSchema>
}
