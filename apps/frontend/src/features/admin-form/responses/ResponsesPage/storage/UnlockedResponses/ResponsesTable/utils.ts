import {
  AdminFormDto,
  FormResponseMode,
  SubmissionMetadata,
} from 'formsg-shared/types'
import { centsToDollars } from 'formsg-shared/utils/payments'

export const getIsPaymentsForm = (form: AdminFormDto | undefined): boolean => {
  if (
    form?.responseMode === FormResponseMode.Encrypt ||
    form?.responseMode === FormResponseMode.Multirespondent
  ) {
    return form.payments_field.enabled
  }
  return false
}

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
