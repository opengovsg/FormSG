import { IPaymentSchema } from 'src/types'

import { centsToDollars } from '../../../../shared/utils/payments'
import { getPaymentInvoiceDownloadUrlPath } from '../../../../shared/utils/urls'

export const getPaymentFields = (payment: IPaymentSchema) => {
  return [
    {
      _id: '__PAYMENT__STATUS', // Payments will have prefixes
      question: 'Payment status', // follows csv title
      answer: payment.status, // value as per csv
      fieldType: 'textfield', // all payment columns are textfields
    },
    {
      _id: '__PAYMENT__PAYER',
      question: 'Payer',
      answer: payment.email,
      fieldType: 'textfield',
    },
    {
      _id: '__PAYMENT__PROOF_OF_PAYMENT',
      question: 'Proof of Payment',
      answer: getPaymentInvoiceDownloadUrlPath(payment.formId, payment._id),
      fieldType: 'textfield',
    },
    {
      _id: '__PAYMENT__INTENT_ID',
      question: 'Payment intent ID',
      answer: payment.paymentIntentId,
      fieldType: 'textfield',
    },
    {
      _id: '__PAYMENT__AMOUNT',
      question: 'Payment amount',
      answer: centsToDollars(payment.amount),
      fieldType: 'textfield',
    },
    {
      _id: '__PAYMENT__PRODUCT_SERVICE',
      question: 'Product/service',
      answer:
        payment.products
          ?.map(({ data, quantity }) => `${data.name} x ${quantity}`)
          .join(', ') || '-',
      fieldType: 'textfield',
    },
    {
      _id: '__PAYMENT__DATETIME',
      question: 'Payment date and time',
      answer: payment.completedPayment?.paymentDate ?? '-',
      fieldType: 'textfield',
    },
    {
      _id: '__PAYMENT__TRANSACTION_FEE',
      question: 'Transaction fee',
      answer: payment.completedPayment?.transactionFee
        ? centsToDollars(payment.completedPayment.transactionFee)
        : '-',
      fieldType: 'textfield',
    },
  ]
}
