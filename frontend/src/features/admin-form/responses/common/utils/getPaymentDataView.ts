import { SubmissionPaymentDto } from '~shared/types'

import { getPaymentInvoiceDownloadUrl } from '~features/public-form/utils/urls'

type PaymentDataViewItem = {
  key: keyof SubmissionPaymentDto
  name: string
  value: string
}

/** Utility functions for prettifying the output of the payment data view. */
export const centsToDollarString = (cents: number) =>
  `S$${(cents / 100).toFixed(2)}`
const toSentenceCase = (str: string) =>
  `${str.charAt(0).toUpperCase()}${str.substring(1).toLowerCase()}`
    // replace underscores with a space
    .replace(/_/g, ' ')

/**
 * webworker friendly full url generation of payment invoice
 * @param hostOrigin
 * @param formId
 * @param paymentId
 * @returns
 */
const getFullInvoiceDownloadUrl = (
  hostOrigin: string,
  formId: string,
  paymentId: string,
): string => {
  const pathName = getPaymentInvoiceDownloadUrl(formId, paymentId)
  const url = new URL(pathName, hostOrigin)
  return url.toString()
}

/**
 * Helper function to obtain the payment field data that we want to display to
 * admins, used both in the individual response page and the exported CSV.
 * @param payment the payment data object returned within the submission object
 * @returns payment data view with an array of names and values, ordered in CSV column order.
 */
export const getPaymentDataView = (
  hostOrigin: string,
  payment: SubmissionPaymentDto,
  formId: string,
): PaymentDataViewItem[] =>
  // Payment data association of keys to values, in CSV column order
  [
    {
      key: 'status',
      name: 'Payment status',
      value: toSentenceCase(payment.status),
    },

    { key: 'email', name: 'Payer', value: payment.email },
    {
      key: 'receiptUrl',
      name: 'Invoice',
      value: getFullInvoiceDownloadUrl(hostOrigin, formId, payment.id),
    },

    {
      key: 'paymentIntentId',
      name: 'Payment intent ID',
      value: payment.paymentIntentId,
    },
    {
      key: 'amount',
      name: 'Payment amount',
      value: centsToDollarString(payment.amount),
    },
    {
      key: 'products',
      name: 'Product/service',
      value:
        payment.products
          ?.map(({ name, quantity }) => `${name} x ${quantity}`)
          .join(', ') || '-',
    },
    {
      key: 'paymentDate',
      name: 'Payment date and time',
      value: payment.paymentDate,
    },

    {
      key: 'transactionFee',
      name: 'Transaction fee',
      value: centsToDollarString(payment.transactionFee),
    },

    {
      key: 'payoutId',
      name: 'Payout ID',
      value: payment.payoutId ?? '-',
    },
    {
      key: 'payoutDate',
      name: 'Payout date and time',
      value: payment.payoutDate ?? '-',
    },
  ]
