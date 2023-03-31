import { Document, Model } from 'mongoose'
import Stripe from 'stripe'

import { Payment } from '../../shared/types/payment'

export interface IPaymentSchema extends Payment, Document {}

export type IPaymentModel = Model<IPaymentSchema>

export interface StripePaymentMetadataDto extends Stripe.Metadata {
  formTitle: string
  formId: string
  paymentId: string
  paymentReceiptEmail: string
}
