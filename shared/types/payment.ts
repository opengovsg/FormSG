import Stripe from 'stripe'
import { DateString } from './generic'

// Stripe Charge status
export enum PaymentStatus {
  Pending = 'pending',
  Failed = 'failed',
  Succeeded = 'succeeded',
  PartiallyRefunded = 'partially_refunded',
  FullyRefunded = 'fully_refunded',
  Disputed = 'disputed',
  DisputeClosed = 'dispute_closed',
  Unknown = 'unknown',
}

export type Payment = {
  submissionId: string
  amount: number
  status: PaymentStatus
  eventLog: Stripe.Event[]
  paymentIntentId: string
  chargeIdLatest?: string
  payoutId?: string
  payoutDate?: Date
  created: DateString
  lastModified: DateString
}

export type PaymentReceiptStatusDto = {
  isReady: boolean
}
