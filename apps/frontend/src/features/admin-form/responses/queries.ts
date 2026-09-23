import { useMemo } from 'react'
import {
  useInfiniteQuery,
  UseInfiniteQueryResult,
  useQuery,
  UseQueryResult,
} from 'react-query'
import { useParams } from 'react-router-dom'

import { FormFeedbackMetaDto, FormIssueMetaDto } from 'formsg-shared/types'
import {
  FormSubmissionMetadataQueryDto,
  SubmissionCountQueryDto,
  SubmissionMetadataList,
} from 'formsg-shared/types/submission'

import { adminFormKeys } from '../common/queries'

import { getFormIssues } from './FeedbackPage/issue/IssueService'
import { getFormFeedback } from './FeedbackPage/review/ReviewService'
import { useStorageResponsesContext } from './ResponsesPage/storage/StorageResponsesContext'
import {
  countFormSubmissions,
  getFormSubmissionsMetadata,
} from './AdminSubmissionsService'

export const adminFormResponsesKeys = {
  base: [...adminFormKeys.base, 'responses'] as const,
  id: (id: string) => [...adminFormResponsesKeys.base, id] as const,
  count: (id: string, dates: [startDate: string, endDate: string] | []) =>
    [...adminFormResponsesKeys.id(id), 'count', ...dates] as const,
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
  infiniteMetadata: (id: string) =>
    [...adminFormResponsesKeys.id(id), 'metadata', 'infinite'] as const,
  individual: (id: string, submissionId: string) =>
    [...adminFormResponsesKeys.id(id), 'individual', submissionId] as const,
  secretKey: (id: string) => [...adminFormResponsesKeys.id(id), 'secretKey'],
}

export const adminFormFeedbackKeys = {
  base: [...adminFormKeys.base, 'feedback'] as const,
  id: (id: string) => [...adminFormFeedbackKeys.base, id] as const,
}
export const adminFormIssueKeys = {
  base: [...adminFormKeys.base, 'issues'] as const,
  id: (id: string) => [...adminFormIssueKeys.base, id] as const,
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useFormResponsesCount = (
  dates?: SubmissionCountQueryDto,
): UseQueryResult<number> => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  let dateParams: [startDate: string, endDate: string] | [] = []

  if (dates?.startDate && dates.endDate) {
    dateParams = [dates.startDate, dates.endDate]
  }

  return useQuery(
    adminFormResponsesKeys.count(formId, dateParams),
    () => countFormSubmissions({ formId, dates }),
    { staleTime: 0 },
  )
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useFormResponses = ({
  page = 1,
  submissionId,
  enabled = true,
}: {
  page?: number
  submissionId?: string
  enabled?: boolean
} = {}): UseQueryResult<SubmissionMetadataList> => {
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
      staleTime: 0,
      keepPreviousData: !submissionId,
      enabled: enabled && !!secretKey && (page > 0 || !!submissionId),
    },
  )
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useInfiniteFormResponses = ({
  enabled = true,
}: {
  enabled?: boolean
} = {}): UseInfiniteQueryResult<SubmissionMetadataList> => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const { secretKey } = useStorageResponsesContext()

  return useInfiniteQuery(
    adminFormResponsesKeys.infiniteMetadata(formId),
    ({ pageParam = 1 }) =>
      getFormSubmissionsMetadata(formId, { page: pageParam }),
    {
      staleTime: 0,
      enabled: enabled && !!secretKey,
      getNextPageParam: (lastPage, allPages) => {
        const loaded = allPages.reduce(
          (total, page) => total + page.metadata.length,
          0,
        )
        if (loaded === 0 || loaded >= lastPage.count) return undefined
        return allPages.length + 1
      },
    },
  )
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useFormFeedback = (): UseQueryResult<FormFeedbackMetaDto> => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return useQuery(
    adminFormFeedbackKeys.id(formId),
    () => getFormFeedback(formId),
    { staleTime: 0 },
  )
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useFormIssues = (): UseQueryResult<FormIssueMetaDto> => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return useQuery(adminFormIssueKeys.id(formId), () => getFormIssues(formId), {
    staleTime: 0,
  })
}
