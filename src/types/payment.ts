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

export type IPaymentModel = Model<IPaymentSchema>

export interface StripePaymentMetadataDto extends Stripe.Metadata {
  env: string
  formTitle: string
  formId: string
  submissionId: string
  paymentId: string
  paymentContactEmail: string
}
