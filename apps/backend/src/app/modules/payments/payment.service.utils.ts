import { PaymentType } from 'formsg-shared/types'
import { centsToDollars } from 'formsg-shared/utils/payments'
import { getPaymentInvoiceDownloadUrlPath } from 'formsg-shared/utils/urls'

import { IPaymentSchema } from '../../../types'
import config from '../../config/config'
import { PaymentWebhookEventObject } from '../webhook/webhook.types'

export const getPaymentLogMeta = (payment: IPaymentSchema) => ({
  _id: String(payment._id),
  status: payment.status,
  chargeIdLatest: payment.chargeIdLatest,
  formId: String(payment.formId),
  pendingSubmissionId: String(payment.pendingSubmissionId),
  paymentIntent: payment.paymentIntentId,
  targetAccountId: payment.targetAccountId,
  created: payment.created,
  lastModified: payment.lastModified,
  completedPayment: payment.completedPayment && {
    paymentDate: payment.completedPayment.paymentDate,
    submissionId: String(payment.completedPayment.submissionId),
    transactionFee: payment.completedPayment.transactionFee,
    receiptUrl: payment.completedPayment.receiptUrl,
    hasReceiptStoredInS3: payment.completedPayment.hasReceiptStoredInS3,
  },
})

export const getPaymentWebhookEventObject = (
  payment: IPaymentSchema,
): PaymentWebhookEventObject | object => {
  // PaymentType.Fixed is deprecated, no need to send any additional fields
  // We don't want admins to continue using this type of payment
  if (payment.payment_fields_snapshot.payment_type === PaymentType.Fixed) {
    return {}
  }

  const paymentEventType = 'payment_charge' // currently only one type of payment
  return {
    type: paymentEventType,
    status: payment.status,
    payer: payment.email,
    url: `${config.app.appUrl}/api/v3/${getPaymentInvoiceDownloadUrlPath(
      payment.formId,
      payment._id,
    )}`,
    paymentIntent: payment.paymentIntentId,
    amount: centsToDollars(payment.amount),
    productService:
      payment.products
        ?.map(({ data, quantity }) => `${data.name} x ${quantity}`)
        .join(', ') || '-',
    dateTime: payment.completedPayment?.paymentDate ?? '-',
    transactionFee: payment.completedPayment?.transactionFee
      ? centsToDollars(payment.completedPayment.transactionFee)
      : '-',
  }
}
