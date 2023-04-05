import { SubmissionPaymentData } from '~shared/types'

type PaymentDataViewItem = {
  key: keyof SubmissionPaymentData
  name: string
  value: string
}

/**
 * Helper function representing a translation table from payment object keys to
 * display name on the individual response page or exported CSV.
 * @param key key to obtain the corresponding name for
 * @returns the name to be displayed to the admin
 */
export const getPaymentDataViewName = (
  key: keyof SubmissionPaymentData,
): string => {
  switch (key) {
    case 'id':
      return 'Payment id'
    case 'amount':
      return 'Payment amount'
    case 'email':
      return 'Payer'
    case 'status':
      return 'Payment status'
    case 'paymentDate':
      return 'Payment date and time'
    case 'paymentIntentId':
      return 'Payment intent ID'
    case 'transactionFee':
      return 'Transaction fee'
    case 'receiptUrl':
      return 'Receipt link'
    case 'payoutId':
      return 'Payout ID'
    case 'payoutDate':
      return 'Payout date and time'
  }
}

/** Utility functions for prettifying the output of the payment data view. */
const centsToDollarString = (cents: number) => `S$${(cents / 100).toFixed(2)}`
const toSentenceCase = (str: string) =>
  `${str.charAt(0).toUpperCase()}${str.substring(1).toLowerCase()}`

/**
 * Helper function to obtain the payment field data that we want to display to
 * admins, used both in the individual response page and the exported CSV.
 * @param payment the payment data object returned within the submission object
 * @returns payment data view with an array of names and values, ordered in CSV column order.
 */
export const getPaymentDataView = (
  payment: SubmissionPaymentData,
): PaymentDataViewItem[] => {
  // Payment data association of keys to values, in CSV column order
  const paymentDataValues: {
    key: keyof SubmissionPaymentData
    value: string
  }[] = [
    { key: 'email', value: payment.email },
    { key: 'receiptUrl', value: payment.receiptUrl },

    { key: 'paymentIntentId', value: payment.paymentIntentId },
    { key: 'amount', value: centsToDollarString(payment.amount) },
    {
      key: 'transactionFee',
      value: centsToDollarString(payment.transactionFee),
    },
    { key: 'status', value: toSentenceCase(payment.status) },
    { key: 'paymentDate', value: payment.paymentDate },

    ...(payment.payoutId
      ? [
          {
            key: 'payoutId' as keyof SubmissionPaymentData,
            value: payment.payoutId,
          },
        ]
      : []),

    ...(payment.payoutDate
      ? [
          {
            key: 'payoutDate' as keyof SubmissionPaymentData,
            value: payment.payoutDate,
          },
        ]
      : []),
  ]

  // Inject names from translation table
  return paymentDataValues.map(({ key, value }) => ({
    key,
    name: getPaymentDataViewName(key),
    value,
  }))
}
