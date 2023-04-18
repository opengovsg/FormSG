import { PaymentIntent } from '@stripe/stripe-js'

export enum PaymentViewStates {
  Invalid,
  Succeeded,
  Canceled,
  PendingPayment,
  Processing, // can lead to decline/failure or succeeded
}
export const getPaymentViewStates = (
  status: PaymentIntent.Status | undefined,
): PaymentViewStates => {
  if (!status) return PaymentViewStates.Invalid
  if (['succeeded'].includes(status)) return PaymentViewStates.Succeeded
  if (['canceled'].includes(status)) return PaymentViewStates.Canceled
  if (['processing'].includes(status)) return PaymentViewStates.Processing
  return PaymentViewStates.PendingPayment
}
