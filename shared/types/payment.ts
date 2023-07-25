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
  Canceled = 'canceled',
}

export enum PaymentChannel {
  Unconnected = 'Unconnected',
  Stripe = 'Stripe',
  // for extensibility to future payment options
}
export enum PaymentType {
  Fixed = 'Fixed',
  Variable = 'Variable',
  // Products = 'Products'
}

export type CompletedPaymentMeta = {
  paymentDate: Date
  submissionId: string
  transactionFee: number
  receiptUrl: string
}

export type PayoutMeta = {
  payoutId: string
  payoutDate: Date
}

export type Payment = {
  // Pre-payment metadata
  pendingSubmissionId: string
  formId: string
  targetAccountId: string
  email: string
  amount: number
  paymentIntentId: string
  gstEnabled: boolean

  // Payment status tracking
  webhookLog: Stripe.Event[]
  status: PaymentStatus
  chargeIdLatest?: string

  // Completed payment metadata
  completedPayment?: CompletedPaymentMeta

  // Payout metadata
  payout?: PayoutMeta

  created: DateString
  lastModified: DateString
}

export type PaymentDto = Payment & { _id: string }

export type PaymentReceiptStatusDto = {
  isReady: boolean
}

export type GetPaymentInfoDto = {
  client_secret: string
  publishableKey: string
  payment_intent_id: string
  submissionId: string
}

export type IncompletePaymentsDto = {
  stripeAccount: string
  paymentId: string
}[]

export type ReconciliationEventsReportLine = {
  event: Stripe.Event
  error?: string
}

export type ReconciliationReportLine = {
  payment: Payment
  paymentIntent: Stripe.PaymentIntent
  mismatch: boolean
  canceled: boolean
}

export type ReconciliationReport = {
  eventsReport: ReconciliationEventsReportLine[]
  reconciliationReport: ReconciliationReportLine[]
}
