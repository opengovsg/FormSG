import { PaymentIntent } from '@stripe/stripe-js'

export enum PaymentViewStates {
  Invalid,
  Succeeded,
  Canceled,
  Pending,
}
export const getPaymentViewStates = (
  status: PaymentIntent.Status | undefined,
): PaymentViewStates => {
  if (!status) return PaymentViewStates.Invalid
  if (['succeeded'].includes(status)) return PaymentViewStates.Succeeded
  if (['canceled'].includes(status)) return PaymentViewStates.Canceled
  return PaymentViewStates.Pending
}
