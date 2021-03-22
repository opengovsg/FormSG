import { Document, Model } from 'mongoose'

import { PublicView } from './database'
import { IFormSchema } from './form'

export interface IVerificationField {
  fieldType: string
  signedData: string | null
  hashedOtp: string | null
  hashCreatedAt: Date | null
  hashRetries: number
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
  expireAt: Date
  fields: IVerificationFieldSchema[]
}

export type UpdateFieldData = {
  transactionId: string
  fieldId: string
  hashedOtp: string
  signedData: string
}

export interface IVerificationSchema
  extends IVerification,
    Document,
    PublicView<PublicTransaction> {
  getField(fieldId: string): IVerificationFieldSchema | undefined
  incrementFieldRetries(fieldId: string): Promise<IVerificationSchema | null>
}

// Keep in sync with VERIFICATION_PUBLIC_FIELDS
export type PublicTransaction = Pick<
  IVerificationSchema,
  'formId' | 'expireAt' | '_id'
>

export interface IVerificationModel extends Model<IVerificationSchema> {
  getPublicViewById(
    id: IVerificationSchema['_id'],
  ): Promise<PublicTransaction | null>
  createTransactionFromForm(
    form: IFormSchema,
  ): Promise<IVerificationSchema | null>
  resetField(
    transactionId: string,
    fieldId: string,
  ): Promise<IVerificationSchema | null>
  updateHashForField(
    updateData: UpdateFieldData,
  ): Promise<IVerificationSchema | null>
}
