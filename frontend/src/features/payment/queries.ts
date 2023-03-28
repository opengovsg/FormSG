import { useQuery, UseQueryResult } from 'react-query'

import { GetPaymentInfoDto, PaymentReceiptStatusDto } from '~shared/types'

import { ApiError } from '~typings/core'

import { getPaymentInfo, getPaymentReceiptStatus } from './FormPaymentService'

export const useGetPaymentReceiptStatus = (
  formId: string,
  paymentId: string,
): UseQueryResult<PaymentReceiptStatusDto, ApiError> => {
  return useQuery<PaymentReceiptStatusDto, ApiError>([formId, paymentId], () =>
    getPaymentReceiptStatus(formId, paymentId),
  )
}

export const useGetPaymentInfo = (
  paymentId: string,
): UseQueryResult<GetPaymentInfoDto, ApiError> => {
  return useQuery<GetPaymentInfoDto, ApiError>(
    paymentId,
    () => getPaymentInfo(paymentId),
    { suspense: true },
  )
}
