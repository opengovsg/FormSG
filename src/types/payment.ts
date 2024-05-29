import { Document, Model } from 'mongoose'
import Stripe from 'stripe'

import { Payment } from '../../shared/types/payment'

import { IEncryptedFormSchema, IFormSchema } from './form'
import { IPendingSubmissionSchema } from './submission'

export interface IPayment extends Payment {
  // overwrites the id type of Payment to be Schema.Types.ObjectId in mongoose
  pendingSubmissionId: IPendingSubmissionSchema['_id']
  formId: IFormSchema['_id']
  payment_fields_snapshot: IEncryptedFormSchema['payments_field']
}

export interface IPaymentSchema extends IPayment, Document {
  /**
   * Additional field to store responses for sending email confirmations post-payment.
   * Will be used to store FilteredResponse[], allows for population.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responses: any[]
}

export interface ICompletedPaymentSchema extends IPaymentSchema {
  completedPayment: NonNullable<IPaymentSchema['completedPayment']>
}

export interface IPaymentModel extends Model<IPaymentSchema> {
  /**
   * Gets payment documents by status
   * @param statuses destructured list of statuses for payments to find
   * @returns list of payment documents with status corresponding to any one of the listed statuses
   */
  getByStatus(...statuses: Payment['status'][]): Promise<IPaymentSchema[]>
}

export interface StripePaymentMetadataDto extends Stripe.Metadata {
  env: string
  formTitle: string
  formId: string
  submissionId: string
  paymentId: string
  paymentContactEmail: string
}
