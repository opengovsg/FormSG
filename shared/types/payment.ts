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
}

export type PaymentReceiptStatusDto = {
  isReady: boolean
}
