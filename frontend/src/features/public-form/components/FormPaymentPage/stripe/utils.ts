import { PaymentIntent } from '@stripe/stripe-js'

export enum PaymentViewStates {
  Invalid,
  Succeeded,
  Canceled,
  PendingPayment,
  Processing,
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
