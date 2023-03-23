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
}

export enum PaymentChannel {
  Stripe = 'Stripe',
  // for extensibility to future payment options
}

<<<<<<< HEAD
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
=======
export type Payment = {
  paymentIntentId: string
  amount: number

  pendingSubmissionId: string
  submissionId?: string

>>>>>>> c36d0812 (feat: add state machine to compute status and move pending submissions to submissions)
  eventLog: Stripe.Event[]
  status: PaymentStatus
  chargeIdLatest?: string
  transactionFee?: number
  receiptUrl?: string

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
