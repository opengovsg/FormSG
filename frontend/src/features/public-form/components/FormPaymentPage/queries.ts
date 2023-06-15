import { FieldPath, FieldValues, RegisterOptions } from 'react-hook-form'
import { useQuery, UseQueryResult } from 'react-query'

import { GetPaymentInfoDto, PaymentReceiptStatusDto } from '~shared/types'

import { ApiError } from '~typings/core'

import { centsToDollars, dollarsToCents } from '~utils/payments'

import { useEnv } from '~features/env/queries'

import { getPaymentInfo, getPaymentReceiptStatus } from './FormPaymentService'

export const paymentSettingKeys = {
  base: ['paymentSettings'] as const,
  receiptStatus: (paymentId: string, formId: string) =>
    [...paymentSettingKeys.base, paymentId, formId] as const,
  paymentInfo: (paymentId: string) =>
    [...paymentSettingKeys.base, paymentId] as const,
}

export const useGetPaymentReceiptStatus = (
  formId: string,
  paymentId: string,
): UseQueryResult<PaymentReceiptStatusDto, ApiError> => {
  return useQuery<PaymentReceiptStatusDto, ApiError>(
    paymentSettingKeys.receiptStatus(paymentId, formId),
    () => getPaymentReceiptStatus(formId, paymentId),
    { retry: true },
  )
}

export const useGetPaymentInfo = (
  paymentId: string,
): UseQueryResult<GetPaymentInfoDto, ApiError> => {
  return useQuery<GetPaymentInfoDto, ApiError>(
    paymentSettingKeys.paymentInfo(paymentId),
    () => getPaymentInfo(paymentId),
    { suspense: true },
  )
}

const formatCurrency = new Intl.NumberFormat('en-SG', {
  style: 'currency',
  currency: 'SGD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format

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
        return `Please enter a payment amount of at least ${formatCurrency(
          Number(centsToDollars(minCentsLimit)),
        )}`
      }

      const validateMax =
        !!maxCentsLimit && !!val && dollarsToCents(val) <= maxCentsLimit
      // Repeat the check on maxCentsLimit for correct typing
      if (!!maxCentsLimit && !validateMax) {
        return `Please enter a payment amount of at most ${formatCurrency(
          Number(centsToDollars(maxCentsLimit)),
        )}`
      }
      return true
    },
  }
  return amountValidation
}
