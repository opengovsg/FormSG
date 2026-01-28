import { useQuery, useQueryClient, UseQueryResult } from 'react-query'
import { useParams } from 'react-router-dom'
import { FormField } from '@opengovsg/formsg-sdk/dist/types'
import { formatInTimeZone } from 'date-fns-tz'

import { DateString, SubmissionMetadata, SubmissionType } from '~shared/types'

import { adminFormResponsesKeys } from '../../queries'

import { useStorageResponsesContext } from './StorageResponsesContext'
import {
  getEncryptedResponsesStream,
  makeWorkerApiAndCleanup,
} from './StorageResponsesService'
import { CleanableDecryptionWorkerApi } from './types'

export type DecryptedResponse = {
  decryptedResponses: FormField[]
} & SubmissionMetadata

// Query key for decrypted responses cache
const decryptedResponsesKey = (
  formId: string,
  dateRange?: { startDate?: DateString; endDate?: DateString },
) =>
  [
    ...adminFormResponsesKeys.id(formId),
    'decrypted',
    dateRange?.startDate ?? 'all',
    dateRange?.endDate ?? 'all',
  ] as const

const NUM_WORKERS = window.navigator.hardwareConcurrency || 4

const killWorkers = (workers: CleanableDecryptionWorkerApi[]): void => {
  return workers.forEach((worker) => worker.cleanup())
}

/**
 * Fetches and decrypts responses.
 * This is extracted to be used by React Query.
 */
async function fetchAndDecryptResponses({
  formId,
  secretKey,
  startDate,
  endDate,
}: {
  formId: string
  secretKey: string
  startDate?: DateString
  endDate?: DateString
}): Promise<DecryptedResponse[]> {
  const workerPool: CleanableDecryptionWorkerApi[] = []

  try {
    for (let i = 0; i < NUM_WORKERS; i++) {
      workerPool.push(makeWorkerApiAndCleanup())
    }

    const stream = await getEncryptedResponsesStream(formId, {
      downloadAttachments: false,
      startDate,
      endDate,
    })

    const reader = stream.getReader()
    let currentSubmissionIndex = 0
    let submissionNumber = 0

    const submissionDecryptPromises: Promise<DecryptedResponse | undefined>[] =
      []

    let read: (result: ReadableStreamReadResult<string>) => void

    await reader.read().then(
      (read = async (result) => {
        if (result.done) return
        const { workerApi } = workerPool[currentSubmissionIndex % NUM_WORKERS]
        const decryptResponsePromise = workerApi
          .parseAndDecryptSubmissionData({
            submissionStreamDtoString: result.value,
            secretKey,
          })
          .then((result) => {
            if (result.isParseSuccessful && result.isDecryptionSuccessful) {
              const submissionTime = formatInTimeZone(
                result.parsedSubmission.created,
                'Asia/Singapore',
                'dd MMM yyyy hh:mm:ss a',
              )
              return {
                number: ++submissionNumber,
                decryptedResponses: result.decryptedResponses,
                refNo: result.parsedSubmission._id,
                submissionTime,
                payments: null,
                mrf:
                  result.parsedSubmission.submissionType ===
                  SubmissionType.Multirespondent
                    ? result.parsedSubmission.mrfMeta
                    : undefined,
              } as DecryptedResponse
            }
            return undefined
          })
        submissionDecryptPromises.push(decryptResponsePromise)
        currentSubmissionIndex++
        return reader.read().then(read)
      }),
    )

    const results = await Promise.all(submissionDecryptPromises)

    // Filter out failed decryptions and sort by submission time (newest first)
    const validResults = results.filter(
      (result): result is DecryptedResponse => result !== undefined,
    )

    // Sort by submission time descending (newest first)
    validResults.sort((a, b) => {
      // Parse the formatted date string back to compare
      const dateA = new Date(a.submissionTime)
      const dateB = new Date(b.submissionTime)
      return dateB.getTime() - dateA.getTime()
    })

    // Re-assign submission numbers after sorting
    validResults.forEach((result, index) => {
      result.number = index + 1
    })

    return validResults
  } finally {
    killWorkers(workerPool)
  }
}

interface UseDecryptedResponsesQueryParams {
  dateRange: [DateString | null, DateString | null]
  enabled?: boolean
}

/**
 * React Query hook that caches decrypted responses.
 * The decryption only happens once and results are cached across navigation.
 *
 * @param params.formId - The form ID
 * @param params.secretKey - The secret key for decryption
 * @param params.startDate - Optional start date filter
 * @param params.endDate - Optional end date filter
 * @param params.enabled - Whether to enable the query (defaults to true)
 */
export const useDecryptedResponsesQuery = ({
  dateRange,
  enabled = true,
}: UseDecryptedResponsesQueryParams): UseQueryResult<DecryptedResponse[]> => {
  const { secretKey } = useStorageResponsesContext()

  const { formId } = useParams()
  if (!formId) {
    throw new Error('No formId provided')
  }
  if (!secretKey) {
    throw new Error('No secretKey provided')
  }

  const startDate = dateRange[0] ?? undefined
  const endDate = dateRange[1] ?? undefined

  return useQuery<DecryptedResponse[]>(
    decryptedResponsesKey(formId, {
      startDate,
      endDate,
    }),
    () =>
      fetchAndDecryptResponses({
        formId,
        secretKey,
        startDate,
        endDate,
      }),
    {
      enabled: enabled && !!formId && !!secretKey,
      // Keep data fresh indefinitely (only manual invalidation triggers refetch)
      staleTime: Infinity,
      // Keep in cache for 30 minutes after component unmounts
      cacheTime: 30 * 60 * 1000,
      // Disable all auto-refetching since fetching and decrypting is expensive
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  )
}

/**
 * Hook to manually invalidate/refetch decrypted responses.
 * Use this when you need to force a refresh (e.g., to fetch latest submissions).
 */
export const useInvalidateDecryptedResponses = (formId: string) => {
  const queryClient = useQueryClient()

  return {
    /** Invalidates decrypted response caches for this form (all date ranges) */
    invalidate: () => {
      // Uses prefix matching - invalidates all queries starting with this key
      queryClient.invalidateQueries([
        ...adminFormResponsesKeys.id(formId),
        'decrypted',
      ])
    },
  }
}
