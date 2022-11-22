import Stripe from 'stripe'

export enum PaymentStatus {
  Failed = 'failed',
  Pending = 'pending',
  Succeeded = 'succeeded',
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
}
