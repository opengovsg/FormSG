import Stripe from 'stripe'

export type Payment = {
  submissionId: string
  amount: number
  status: Stripe.Charge.Status
  webhookLog: Stripe.Event[]
  paymentIntentId: string
  chargeIdLatest: string
  payoutId: string
  payoutDate: Date
}
