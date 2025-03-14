import { SubmissionMetadata } from '~shared/types'
import { centsToDollars } from '~shared/utils/payments'

// TODO(#8204) Extract out 'Est. ' once this is used as a hook
export const getNetAmount = (payments: SubmissionMetadata['payments']) => {
  if (!payments) {
    return ''
  }
  if (payments.transactionFee == null) {
    return ''
  }
  if (payments.transactionFee < 0) {
    return ''
  }
  const grossAmt = centsToDollars(payments.paymentAmt - payments.transactionFee)
  const isFinalTransactionFee = payments.payoutDate
  if (!isFinalTransactionFee) {
    return `Est. ${grossAmt}`
  }
  return `${grossAmt}`
}
