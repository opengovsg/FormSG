import { useQuery, UseQueryResult } from 'react-query'

import { GetPaymentInfoDto, PaymentReceiptStatusDto } from '~shared/types'

import { ApiError } from '~typings/core'

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
