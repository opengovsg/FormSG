import { Document, Model } from 'mongoose'
import Stripe from 'stripe'

import { Payment } from '../../shared/types/payment'

export interface IPaymentSchema extends Payment, Document {
  /**
   * Additional field to store responses for sending email confirmations post-payment.
   * Will be used to store FilteredResponse[], allows for population.
   */
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
