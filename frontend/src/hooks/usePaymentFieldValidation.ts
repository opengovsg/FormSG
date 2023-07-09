import { FieldPath, FieldValues, RegisterOptions } from 'react-hook-form'

import { centsToDollars, dollarsToCents, formatCurrency } from '~utils/payments'

import { useEnv } from '~features/env/queries'

export const usePaymentFieldValidation = <
  T extends FieldValues,
  V extends FieldPath<T>,
>(options?: {
  greaterThanCents?: number
  lesserThanCents?: number
}) => {
  const {
    data: {
      maxPaymentAmountCents = Number.MAX_SAFE_INTEGER,
      minPaymentAmountCents = Number.MIN_SAFE_INTEGER,
    } = {},
  } = useEnv()

  const {
    lesserThanCents: maxCents = Number.MAX_SAFE_INTEGER,
    greaterThanCents: minCents = Number.MIN_SAFE_INTEGER,
  } = options || {}
  const maxCentsLimit = Math.min(maxCents, maxPaymentAmountCents)
  const minCentsLimit = Math.max(minCents, minPaymentAmountCents)

  const amountValidation: RegisterOptions<T, V> = {
    validate: (val) => {
      // Validate that it is a money value.
      // Regex allows leading and trailing spaces, max 2dp
      const validateMoney = /^\s*(\d+)(\.\d{0,2})?\s*$/.test(val ?? '')
      if (!validateMoney) return 'Please enter a valid payment amount'

      const validateMin =
        !!minCentsLimit && !!val && dollarsToCents(val) >= minCentsLimit
      // Repeat the check on minCentsLimit for correct typing
      if (!!minCentsLimit && !validateMin) {
        return `The minimum amount is ${formatCurrency(
          Number(centsToDollars(minCentsLimit)),
        )}`
      }

      const validateMax =
        !!maxCentsLimit && !!val && dollarsToCents(val) <= maxCentsLimit
      // Repeat the check on maxCentsLimit for correct typing
      if (!!maxCentsLimit && !validateMax) {
        return `Enter a maximum amount that is not more than ${formatCurrency(
          Number(centsToDollars(maxCentsLimit)),
        )}`
      }
      return true
    },
  }
  return amountValidation
}
