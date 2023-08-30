import { StorageModeSubmissionMetadata } from '~shared/types'
import { centsToDollars } from '~shared/utils/payments'

export const getNetAmount = (
  payments: StorageModeSubmissionMetadata['payments'],
) => {
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
