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
  fieldId: string
  hashCreatedAt?: Date | null
  hashedOtp?: string | null
  signedData?: string | null
  hashRetries?: number
}

export interface IVerificationSchema
  extends IVerification,
    Document,
    PublicView<PublicTransaction> {
  getField(fieldId: string): IVerificationFieldSchema | undefined
  updateDataForField(
    updateData: UpdateFieldData,
  ): Promise<IVerificationSchema | null>
  incrementFieldRetries(fieldId: string): Promise<IVerificationSchema | null>
  resetField(fieldId: string): Promise<IVerificationSchema | null>
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
}
