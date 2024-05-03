import { useQuery, UseQueryResult } from 'react-query'

import { PublicFormViewDto } from '~shared/types/form/form'

import { ApiError } from '~typings/core'

import { MONGODB_ID_REGEX } from '~constants/routes'

import {
  getMultirespondentSubmissionById,
  getPublicFormView,
} from './PublicFormService'
import { MultirespondentSubmissionDtoWithAttachments } from './types'

export const publicFormKeys = {
  // All keys map to either an array or function returning an array for
  // consistency
  base: ['publicForm'] as const,
  id: (formId: string) => [...publicFormKeys.base, formId] as const,
  submission: (formId: string, submissionId?: string) =>
    [...publicFormKeys.id(formId), submissionId] as const,
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
      enabled: MONGODB_ID_REGEX.test(formId) && enabled,
    },
  )
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useEncryptedSubmission = (
  formId: string,
  submissionId?: string,
  /** Extra override to determine whether query is enabled */
  enabled = true,
): UseQueryResult<MultirespondentSubmissionDtoWithAttachments, ApiError> => {
  return useQuery(
    publicFormKeys.submission(formId, submissionId),
    () =>
      submissionId
        ? getMultirespondentSubmissionById({ formId, submissionId })
        : undefined,
    {
      // Treat submission as static on load.
      staleTime: Infinity,
      enabled:
        MONGODB_ID_REGEX.test(formId) &&
        (!submissionId || MONGODB_ID_REGEX.test(submissionId)) &&
        enabled,
    },
  )
}
