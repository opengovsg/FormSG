import { FieldPath, FieldValues, RegisterOptions } from 'react-hook-form'

import {
  centsToDollars,
  dollarsToCents,
  formatCurrency,
} from '~shared/utils/payments'

import { useEnv } from '~features/env/queries'

/**
 *
 * @param options.greaterThanCents The minimum amount in cents
 * @param options.lesserThanCents The maximum amount in cents
 * @param options.overrideMinAmount The minimum amount in cents that overrides the global minimum amount
 * @param options.msgWhenEmpty The message to display when the field is empty
 * @returns
 */
export const usePaymentFieldValidation = <
  T extends FieldValues,
  V extends FieldPath<T>,
>(options?: {
  greaterThanCents?: number
  lesserThanCents?: number
  overrideMinAmount?: number
  msgWhenEmpty?: string
}) => {
  const {
    data: {
      maxPaymentAmountCents: envMaxPaymentAmountCents = Number.MAX_SAFE_INTEGER,
      minPaymentAmountCents: envMinPaymentAmountCents = Number.MIN_SAFE_INTEGER,
    } = {},
  } = useEnv()

  const maxAmountCents = envMaxPaymentAmountCents
  const minAmountCents = options?.overrideMinAmount || envMinPaymentAmountCents

  const {
    lesserThanCents: maxCents = Number.MAX_SAFE_INTEGER,
    greaterThanCents: minCents = Number.MIN_SAFE_INTEGER,
    msgWhenEmpty = '',
  } = options || {}
  const maxCentsLimit = Math.min(maxCents, maxAmountCents)
  const minCentsLimit = Math.max(minCents, minAmountCents)

  const amountValidation: RegisterOptions<T, V> = {
    validate: (val) => {
      if (!val && msgWhenEmpty) {
        return msgWhenEmpty
      }

      // Validate that it is a money value.
      // Regex allows leading and trailing spaces, max 2dp
      const validateMoney = /^\s*(\d+)(\.\d{0,2})?\s*$/.test(val ?? '')
      if (!validateMoney) return 'Please enter a valid payment amount'

      const validateMin =
        !!minCentsLimit && !!val && dollarsToCents(val) >= minCentsLimit
      // Repeat the check on minCentsLimit for correct typing
      if (!!minCentsLimit && !validateMin) {
        return `The minimum amount is S${formatCurrency(
          Number(centsToDollars(minCentsLimit)),
        )}`
      }

      const validateMax =
        !!maxCentsLimit && !!val && dollarsToCents(val) <= maxCentsLimit
      // Repeat the check on maxCentsLimit for correct typing
      if (!!maxCentsLimit && !validateMax) {
        return `The maximum amount is S${formatCurrency(
          Number(centsToDollars(maxCentsLimit)),
        )}`
      }
      return true
    },
  }
  return amountValidation
}
