import { useCallback, useEffect, useState } from 'react'
import { FormField } from '@opengovsg/formsg-sdk/dist/types'

import { DateString, SubmissionMetadata, SubmissionType } from '~shared/types'

import {
  getEncryptedResponsesStream,
  makeWorkerApiAndCleanup,
} from './StorageResponsesService'
import { CleanableDecryptionWorkerApi } from './types'

const killWorkers = (workers: CleanableDecryptionWorkerApi[]): void => {
  return workers.forEach((worker) => worker.cleanup())
}

const NUM_WORKERS = window.navigator.hardwareConcurrency || 4

const useDecryptResponses = () => {
  const [workers, setWorkers] = useState<CleanableDecryptionWorkerApi[]>([])

  useEffect(() => {
    return () => killWorkers(workers)
  }, [workers])

  const decryptResponses = useCallback(
    async ({
      formId,
      secretKey,
      endDate,
      startDate,
    }: {
      formId: string
      secretKey: string
      startDate?: DateString
      endDate?: DateString
    }) => {
      let currentSubmissionIndex = 0
      let submissionNumber = 0
      if (workers.length) killWorkers(workers)

      const workerPool: CleanableDecryptionWorkerApi[] = []
      for (let i = workerPool.length; i < NUM_WORKERS; i++) {
        workerPool.push(makeWorkerApiAndCleanup())
      }
      setWorkers(workerPool)

      const stream = await getEncryptedResponsesStream(formId, {
        downloadAttachments: false,
        startDate,
        endDate,
      })
      const reader = stream.getReader()
      let read: (result: ReadableStreamReadResult<string>) => void

      const submissionDecryptPromises: Promise<
        | ({
            decryptedResponses: FormField[]
          } & SubmissionMetadata)
        | undefined
      >[] = []

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
                return {
                  number: ++submissionNumber,
                  decryptedResponses: result.decryptedResponses,
                  refNo: result.parsedSubmission._id,
                  submissionTime: result.parsedSubmission.created,
                  payments: null,
                  mrf:
                    result.parsedSubmission.submissionType ===
                    SubmissionType.Multirespondent
                      ? result.parsedSubmission.mrfMeta
                      : undefined,
                } as {
                  decryptedResponses: FormField[]
                } & SubmissionMetadata
              }
              return
            })
          submissionDecryptPromises.push(decryptResponsePromise)
          currentSubmissionIndex++
          return reader.read().then(read)
        }),
      )

      return Promise.all(submissionDecryptPromises).finally(() => {
        killWorkers(workers)
      })
    },
    [workers],
  )

  return { decryptResponses }
}

export default useDecryptResponses
