import { useQuery, UseQueryResult } from 'react-query'

import { PublicFormViewDto } from '~shared/types/form/form'
import { PaymentReceiptStatusDto } from '~shared/types/payment'

import { ApiError } from '~typings/core'

import { FORMID_REGEX } from '~constants/routes'

import { getPaymentReceiptStatus, getPublicFormView } from './PublicFormService'

export const publicFormKeys = {
  // All keys map to either an array or function returning an array for
  // consistency
  base: ['publicForm'] as const,
  id: (formId: string) => [...publicFormKeys.base, formId] as const,
}

export const usePublicFormView = (
  formId: string,
  /** Extra override to determine whether query is enabled */
  enabled = true,
): UseQueryResult<PublicFormViewDto, ApiError> => {
  return useQuery<PublicFormViewDto, ApiError>(
    publicFormKeys.id(formId),
    () => getPublicFormView(formId),
    {
      // Treat form as static on load.
      staleTime: Infinity,
      enabled: FORMID_REGEX.test(formId) && enabled,
    },
  )
}

export const useGetPaymentReceiptStatus = (
  formId: string,
  submissionId: string,
): UseQueryResult<PaymentReceiptStatusDto, ApiError> => {
  return useQuery<PaymentReceiptStatusDto, ApiError>(
    [formId, submissionId],
    () => getPaymentReceiptStatus(formId, submissionId),
  )
}
