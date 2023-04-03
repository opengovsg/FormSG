import { PaymentIntent } from '@stripe/stripe-js'

export const getPaymentViewType = (
  status: PaymentIntent.Status | undefined,
) => {
  if (!status) return 'invalid'
  if (['succeeded'].includes(status)) return 'receipt'
  if (['canceled'].includes(status)) return 'canceled'
  return 'payment'
}
