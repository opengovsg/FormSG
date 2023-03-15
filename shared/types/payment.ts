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

export enum PaymentChannel {
  Stripe = 'Stripe',
  // for extensibility to future payment options
}

export type CompletedPaymentMeta = {
  paymentDate: Date
  submissionId: string
  transactionFee: number
  receiptUrl: string
}

export type PayoutMeta = {
  payoutId?: string
  payoutDate?: Date
}

export type Payment = {
  // Pre-payment metadata
  pendingSubmissionId: string
  email: string
  amount: number
<<<<<<< HEAD
  paymentIntentId: string

  // Payment status tracking
  webhookLog: Stripe.Event[]
  status: PaymentStatus
  chargeIdLatest?: string

  // Completed payment metadata
  completedPayment?: CompletedPaymentMeta

  // Payout metadata
  payout?: PayoutMeta

  created: DateString
=======
  status: PaymentStatus
  eventLog: Stripe.Event[]
  paymentIntentId: string
  chargeIdLatest?: string
  payoutId?: string
  payoutDate?: Date
  created: DateString
  email: string
  lastModified: DateString
>>>>>>> 3485f6e4 (feat: add state machine to recompute state on each received event)
}

export type PaymentReceiptStatusDto = {
  isReady: boolean
}
