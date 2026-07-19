import { useQuery, UseQueryResult } from 'react-query'
import { FormField } from '@opengovsg/formsg-sdk/dist/types'
import { formatInTimeZone } from 'date-fns-tz'

import {
  DateString,
  SubmissionMetadata,
  SubmissionType,
} from 'formsg-shared/types'

import { env } from '~/env'

import {
  killWorkers,
  makeWorkerApiAndCleanup,
} from '../../common/utils/decryptionWorker'
import { adminFormResponsesKeys } from '../../queries'

import { getEncryptedResponsesStream } from './StorageResponsesService'
import { CleanableDecryptionWorkerApi } from './types'

export type DecryptedResponse = {
  decryptedResponses: FormField[]
} & SubmissionMetadata

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
            // Resolved on the main thread so the worker need not import env.ts
            // (which references window).
            workerCtxOptions: { formsgSdkMode: env.formsgSdkMode },
          })
          .then((result) => {
            if (result.isParseSuccessful && result.isDecryptionSuccessful) {
              const submissionTime = formatInTimeZone(
                result.parsedSubmission.created,
                'Asia/Singapore',
                'dd MMM yyyy hh:mm:ss a',
              )
              return {
                // Placeholder; the real '#' is assigned by display order below,
                // since these promises resolve out of order.
                number: 0,
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

    // Number rows by final position (stream order) so '#' is sequential.
    return results
      .filter((result): result is DecryptedResponse => result !== undefined)
      .map((result, index) => ({ ...result, number: index + 1 }))
  } finally {
    killWorkers(workerPool)
  }
}

interface UseDecryptedResponsesQueryParams {
  formId: string
  secretKey: string
  startDate?: DateString
  endDate?: DateString
  enabled?: boolean
}

/**
 * Fetches and decrypts responses for the given form/date range, cached by
 * React Query. Decryption is expensive, so results are cached and never
 * auto-refetched.
 */
export const useDecryptedResponsesQuery = ({
  formId,
  secretKey,
  startDate,
  endDate,
  enabled = true,
}: UseDecryptedResponsesQueryParams): UseQueryResult<DecryptedResponse[]> => {
  return useQuery<DecryptedResponse[]>(
    decryptedResponsesKey(formId, { startDate, endDate }),
    () =>
      fetchAndDecryptResponses({
        formId,
        secretKey,
        startDate,
        endDate,
      }),
    {
      enabled: enabled && !!formId && !!secretKey,
      staleTime: Infinity,
      cacheTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  )
}
