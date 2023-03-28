import { useQuery, UseQueryResult } from 'react-query'
import { PaymentIntentResult, Stripe } from '@stripe/stripe-js'

import { GetPaymentInfoDto, PaymentReceiptStatusDto } from '~shared/types'

import { ApiError } from '~typings/core'

import { getPaymentInfo, getPaymentReceiptStatus } from './FormPaymentService'

export const useGetPaymentReceiptStatus = (
  formId: string,
  submissionId: string,
): UseQueryResult<PaymentReceiptStatusDto, ApiError> => {
  return useQuery<PaymentReceiptStatusDto, ApiError>(
    [formId, submissionId],
    () => getPaymentReceiptStatus(formId, submissionId),
  )
}

export const useGetPaymentReceiptStatusFromStripe = ({
  clientSecret,
  stripe,
  refetchKey, // a nonce which triggers refetch if changed
}: {
  clientSecret: string
  stripe: Stripe
  refetchKey: number
}) => {
  return useQuery<PaymentIntentResult, ApiError>(
    [clientSecret, refetchKey],
    () => stripe.retrievePaymentIntent(clientSecret),
    { suspense: true },
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
