import { useQuery, UseQueryResult } from 'react-query'

import { PublicFormViewDto } from '~shared/types/form/form'

import { ApiError } from '~typings/core'

import { FORMID_REGEX } from '~constants/routes'

import { PaymentReceiptDto } from '../../../../shared/types'

import { getPaymentReceipt, getPublicFormView } from './PublicFormService'

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

export const useGetPaymentReceipt = (
  formId: string,
  submissionId: string,
): UseQueryResult<PaymentReceiptDto, ApiError> => {
  return useQuery<PaymentReceiptDto, ApiError>([formId, submissionId], () =>
    getPaymentReceipt(formId, submissionId),
  )
}
