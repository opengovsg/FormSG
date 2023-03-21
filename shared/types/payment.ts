import Stripe from 'stripe'
import { DateString } from './generic'
import type { Opaque } from 'type-fest'

export enum PaymentStatus {
  Failed = 'failed',
  Pending = 'pending',
  Succeeded = 'succeeded',
}

export type PaymentId = Opaque<string, 'PaymentId'>

export type Payment = {
  _id: PaymentId
  submissionId: string
  amount: number
  status: PaymentStatus
  webhookLog: Stripe.Event[]
  paymentIntentId: string
  chargeIdLatest: string
  payoutId: string
  payoutDate: Date
  created: DateString
  stripeTransactionFee: number
  receiptUrl: string
  email: string
}

export type PaymentReceiptStatusDto = {
  isReady: boolean
}
