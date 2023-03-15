import Stripe from 'stripe'
import { DateString } from './generic'

export enum PaymentStatus {
  Failed = 'failed',
  Pending = 'pending',
  Succeeded = 'succeeded',
}

export enum PaymentChannel {
  Stripe = 'Stripe',
  // for extensibility to future payment options
}

export type Payment = {
  submissionId: string
  amount: number
  status: PaymentStatus
  webhookLog: Stripe.Event[]
  paymentIntentId: string
  chargeIdLatest: string
  payoutId: string
  payoutDate: Date
  created: DateString
}

export type PaymentReceiptDto = {
  receipt: string
}
