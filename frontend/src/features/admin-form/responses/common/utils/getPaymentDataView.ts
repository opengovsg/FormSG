import { SubmissionPaymentDto } from '~shared/types'

type PaymentDataViewItem = {
  key: keyof SubmissionPaymentDto
  name: string
  value: string
}

/** Utility functions for prettifying the output of the payment data view. */
const centsToDollarString = (cents: number) => `S$${(cents / 100).toFixed(2)}`
const toSentenceCase = (str: string) =>
  `${str.charAt(0).toUpperCase()}${str.substring(1).toLowerCase()}`
    // replace underscores with a space
    .replace(/_/g, ' ')

/**
 * Helper function to obtain the payment field data that we want to display to
 * admins, used both in the individual response page and the exported CSV.
 * @param payment the payment data object returned within the submission object
 * @returns payment data view with an array of names and values, ordered in CSV column order.
 */
export const getPaymentDataView = (
  payment: SubmissionPaymentDto,
): PaymentDataViewItem[] =>
  // Payment data association of keys to values, in CSV column order
  [
    {
      key: 'status',
      name: 'Payment status',
      value: toSentenceCase(payment.status),
    },

    { key: 'email', name: 'Payer', value: payment.email },
    { key: 'receiptUrl', name: 'Receipt', value: payment.receiptUrl },

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
      key: 'paymentDate',
      name: 'Payment date and time',
      value: payment.paymentDate,
    },

    {
      key: 'transactionFee',
      name: 'Transaction fee',
      value: centsToDollarString(payment.transactionFee),
    },

    ...(payment.payoutId
      ? [
          {
            key: 'payoutId' as keyof SubmissionPaymentDto,
            name: 'Payout ID',
            value: payment.payoutId,
          },
        ]
      : []),

    ...(payment.payoutDate
      ? [
          {
            key: 'payoutDate' as keyof SubmissionPaymentDto,
            name: 'Payout date and time',
            value: payment.payoutDate,
          },
        ]
      : []),
  ]
