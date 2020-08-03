import { Document } from 'mongoose'

import { IFormSchema } from './form'

export interface IVerificationField {
  fieldType: string
  signedData: string | null
  hashedOtp: string | null
  hashCreatedAt: Date | null
  hashRetries: number
}

export interface IVerificationFieldSchema extends IVerificationField, Document {
  // _id is basically a generated transactionId, so it has to be a string,
  // instead of being converted to a string from ObjectId.
  // This must be a string, or transaction fetching will fail.
  _id: string
}

export interface IVerification {
  formId: IFormSchema['_id']
  expireAt: Date
  fields: IVerificationFieldSchema[]
}

export interface IVerificationSchema extends IVerification, Document {}
