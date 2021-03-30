import { Document, Model } from 'mongoose'

import { PublicView } from './database'
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
  expireAt: Date
  fields: IVerificationFieldSchema[]
}

export interface IVerificationSchema
  extends IVerification,
    Document,
    PublicView<PublicTransaction> {
  /**
   * Retrieves an individual field in a transaction, or undefined if not found
   * @param fieldId
   */
  getField(fieldId: string): IVerificationFieldSchema | undefined
  /**
   * Extracts non-sensitive fields from a transaction
   */
  getPublicView(): PublicTransaction
}

// Keep in sync with VERIFICATION_PUBLIC_FIELDS
export type PublicTransaction = Pick<
  IVerificationSchema,
  'formId' | 'expireAt' | '_id'
>

export interface IVerificationModel extends Model<IVerificationSchema> {
  /**
   * Retrieves non-sensitive fields of a transaction, given its ID
   * @param id Transaction ID
   */
  getPublicViewById(
    id: IVerificationSchema['_id'],
  ): Promise<PublicTransaction | null>
  /**
   * Creates a transaction given a form document. Returns null if the form
   * has no verifiable fields.
   * @param form Form document
   */
  createTransactionFromForm(
    form: IFormSchema,
  ): Promise<IVerificationSchema | null>
  /**
   * Resets the hash records of a single field.
   */
  resetField(
    transactionId: string,
    fieldId: string,
  ): Promise<IVerificationSchema | null>
}
