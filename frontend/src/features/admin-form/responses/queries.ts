import { useQuery, UseQueryResult } from 'react-query'
import { useParams } from 'react-router-dom'

import { FormFeedbackMetaDto } from '~shared/types'
import { StorageModeSubmissionMetadataList } from '~shared/types/submission'

import { adminFormKeys } from '../common/queries'

import { getFormFeedback } from './FeedbackPage/FeedbackService'
import { useStorageResponsesContext } from './ResponsesPage/storage/StorageResponsesContext'
import {
  countFormSubmissions,
  getFormSubmissionsMetadata,
} from './AdminSubmissionsService'

export const adminFormResponsesKeys = {
  base: [...adminFormKeys.base, 'responses'] as const,
  id: (id: string) => [...adminFormResponsesKeys.base, id] as const,
  count: (id: string) => [...adminFormResponsesKeys.id(id), 'count'] as const,
  metadata: (id: string, page = 1) =>
    [...adminFormResponsesKeys.id(id), 'metadata', page] as const,
  individual: (id: string, submissionId: string) =>
    [...adminFormResponsesKeys.id(id), 'individual', submissionId] as const,
}

export const adminFormFeedbackKeys = {
  base: [...adminFormKeys.base, 'feedback'] as const,
  id: (id: string) => [...adminFormFeedbackKeys.base, id] as const,
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useFormResponsesCount = (): UseQueryResult<number> => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return useQuery(
    adminFormResponsesKeys.count(formId),
    () => countFormSubmissions({ formId }),
    { staleTime: 10 * 60 * 1000 },
  )
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useFormResponses = (
  page = 1,
): UseQueryResult<StorageModeSubmissionMetadataList> => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const { secretKey } = useStorageResponsesContext()

  return useQuery(
    adminFormResponsesKeys.metadata(formId, page),
    () => getFormSubmissionsMetadata(formId, page),
    {
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
      enabled: !!secretKey && page > 0,
    },
  )
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useFormFeedback = (): UseQueryResult<FormFeedbackMetaDto> => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return useQuery(adminFormFeedbackKeys.id(formId), () =>
    getFormFeedback(formId),
  )
}
