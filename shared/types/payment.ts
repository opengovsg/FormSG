import Stripe from 'stripe'
import { DateString } from './generic'

// Stripe Charge status
export enum PaymentStatus {
  Pending = 'Pending',
  Failed = 'Failed',
  Succeeded = 'Succeeded',
  PartiallyRefunded = 'Partially refunded',
  FullyRefunded = 'Fully refunded',
  Disputed = 'Disputed',
  DisputeClosed = 'Dispute closed',
  Unknown = 'Unknown',
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
  receiptUrl: string
}

export type PaymentReceiptStatusDto = {
  isReady: boolean
}
