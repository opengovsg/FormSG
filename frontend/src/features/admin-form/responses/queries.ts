import { useMemo } from 'react'
import { useQuery, UseQueryResult } from 'react-query'
import { useParams } from 'react-router-dom'

import { FormFeedbackMetaDto } from '~shared/types'
import {
  FormSubmissionMetadataQueryDto,
  StorageModeSubmissionMetadataList,
} from '~shared/types/submission'

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
  metadata: (id: string, params: FormSubmissionMetadataQueryDto) => {
    const builtParams = params.submissionId
      ? [params.submissionId]
      : [params.page ?? 1]
    return [
      ...adminFormResponsesKeys.id(id),
      'metadata',
      ...builtParams,
    ] as const
  },
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
export const useFormResponses = ({
  page = 1,
  submissionId,
}: {
  page?: number
  submissionId?: string
} = {}): UseQueryResult<StorageModeSubmissionMetadataList> => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const { secretKey } = useStorageResponsesContext()

  const params = useMemo(() => {
    if (submissionId) {
      return { submissionId }
    }
    return { page }
  }, [page, submissionId])

  return useQuery(
    adminFormResponsesKeys.metadata(formId, params),
    () => getFormSubmissionsMetadata(formId, params),
    {
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      // Data will never change.
      staleTime: Infinity,
      keepPreviousData: !submissionId,
      enabled: !!secretKey && (page > 0 || !!submissionId),
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
