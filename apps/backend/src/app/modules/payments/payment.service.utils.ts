import { PaymentType } from '../../../../shared/types'
import { centsToDollars } from '../../../../shared/utils/payments'
import { getPaymentInvoiceDownloadUrlPath } from '../../../../shared/utils/urls'
import config from '../../../app/config/config'
import { IPaymentSchema } from '../../../types'
import { PaymentWebhookEventObject } from '../webhook/webhook.types'

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
