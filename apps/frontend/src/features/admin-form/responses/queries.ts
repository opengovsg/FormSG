import { useMemo } from 'react'
import {
  useInfiniteQuery,
  UseInfiniteQueryResult,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from 'react-query'
import { useParams } from 'react-router-dom'
import { FormField } from '@opengovsg/formsg-sdk/dist/types'

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
import { TABLE_RESPONSE_LIMIT } from './ResponsesPage/storage/UnlockedResponses/responseLimit'
import {
  countFormSubmissions,
  getAllDecryptedSubmission,
  getFormSubmissionsMetadata,
} from './AdminSubmissionsService'
import { TABLE_DECRYPTION_PUBLISH_INTERVAL_MS } from './constants'
import { logProgress, perSecond, secondsSince } from './progressLog'

/** The publish tick is 250ms, so this logs about once a second. */
const PROGRESS_LOG_EVERY_N_PUBLISHES = 4

/**
 * A submission's answers, by field id. A form with two hundred fields renders
 * two hundred cells a row, and each one wants a single answer, so the shape it
 * is stored in decides whether that is a lookup or a scan.
 */
export type DecryptedResponsesBySubmissionId = Map<
  string,
  Map<string, FormField>
>

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
  allMetadata: (id: string, dates: string[]) =>
    [...adminFormResponsesKeys.id(id), 'metadata', 'all', ...dates] as const,
  decryptedResponses: (id: string, dates: string[]) =>
    [
      ...adminFormResponsesKeys.id(id),
      'decrypted-responses',
      ...dates,
    ] as const,
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
 * Fetches the most recent TABLE_RESPONSE_LIMIT submissions in one request.
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useAllFormResponses = ({
  enabled = true,
}: {
  enabled?: boolean
} = {}): UseQueryResult<SubmissionMetadataList> => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const { secretKey, dateRange } = useStorageResponsesContext()
  const [startDate, endDate] = dateRange

  return useQuery(
    adminFormResponsesKeys.allMetadata(formId, dateRange),
    async () => {
      const startedAt = performance.now()
      logProgress('metadata fetch start', { pageSize: TABLE_RESPONSE_LIMIT })

      const result = await getFormSubmissionsMetadata(formId, {
        page: 1,
        pageSize: TABLE_RESPONSE_LIMIT,
        ...(startDate && endDate ? { startDate, endDate } : {}),
      })

      logProgress('metadata fetch done', {
        rows: result.metadata.length,
        totalOnForm: result.count,
        seconds: secondsSince(startedAt),
      })
      return result
    },
    {
      staleTime: 0,
      enabled: enabled && !!secretKey,
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
export const useDecryptedResponsesBySubmissionId = ({
  enabled = true,
}: {
  enabled?: boolean
} = {}): UseQueryResult<DecryptedResponsesBySubmissionId> => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const { secretKey, dateRange } = useStorageResponsesContext()
  const [startDate, endDate] = dateRange
  const queryClient = useQueryClient()
  const queryKey = adminFormResponsesKeys.decryptedResponses(formId, dateRange)

  return useQuery(
    queryKey,
    async () => {
      const decrypted: DecryptedResponsesBySubmissionId = new Map()
      let lastPublishedAt = 0
      let publishCount = 0
      const startedAt = performance.now()

      logProgress('decrypt start', { limit: TABLE_RESPONSE_LIMIT })

      const publish = () => {
        queryClient.setQueryData(queryKey, new Map(decrypted))
      }

      await getAllDecryptedSubmission({
        formId,
        secretKey: secretKey as string,
        startDate: startDate ?? '',
        endDate: endDate ?? '',
        downloadAttachments: false,
        isSortByLatest: true,
        limit: TABLE_RESPONSE_LIMIT,
        onSubmissionDecrypted: ({ submissionId, responses }) => {
          // Indexed as it arrives, so a cell reads its answer by field id
          // rather than scanning every response on the submission.
          decrypted.set(
            submissionId,
            new Map(responses.map((response) => [response._id, response])),
          )
          const now = performance.now()
          if (now - lastPublishedAt < TABLE_DECRYPTION_PUBLISH_INTERVAL_MS) {
            return
          }
          lastPublishedAt = now
          publish()

          publishCount += 1
          if (publishCount % PROGRESS_LOG_EVERY_N_PUBLISHES === 0) {
            logProgress('decrypting', {
              done: decrypted.size,
              of: TABLE_RESPONSE_LIMIT,
              perSecond: perSecond(decrypted.size, startedAt),
              seconds: secondsSince(startedAt),
            })
          }
        },
      })

      logProgress('decrypt done', {
        done: decrypted.size,
        seconds: secondsSince(startedAt),
      })

      return decrypted
    },
    {
      staleTime: Infinity,
      enabled: enabled && !!secretKey,
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
