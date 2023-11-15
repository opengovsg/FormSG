import Stripe from 'stripe'
import { FormPaymentsField, ProductItem } from './form'
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

export enum PaymentMethodType {
  Unset = '',
  Paynow = 'Paynow',
}

export enum PaymentType {
  Fixed = 'Fixed',
  Variable = 'Variable',
  Products = 'Products',
}

export type CompletedPaymentMeta = {
  paymentDate: Date
  submissionId: string
  transactionFee: number
  receiptUrl: string
  hasReceiptStoredInS3: boolean
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

  // Purchased Products information
  products?: ProductItem[]

  // Snapshot of form payment fields at point of payment
  payment_fields_snapshot: FormPaymentsField

  created: DateString
  lastModified: DateString
}

export type PaymentDto = Payment & { _id: string }

export type PaymentReceiptStatusDto = {
  isReady: boolean
  paymentDate: Date | null
}

export type GetPaymentInfoDto = {
  client_secret: string
  publishableKey: string
  payment_intent_id: string
  submissionId: string
  products: Payment['products']
  amount: Payment['amount']
  payment_fields_snapshot: Payment['payment_fields_snapshot']
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
