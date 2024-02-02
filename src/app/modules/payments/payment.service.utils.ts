import config from 'src/app/config/config'
import { IPaymentSchema } from 'src/types'

import { centsToDollars } from '../../../../shared/utils/payments'
import { getPaymentInvoiceDownloadUrlPath } from '../../../../shared/utils/urls'

export const getPaymentFields = (payment: IPaymentSchema) => {
  return {
    type: 'payment_charge',
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
