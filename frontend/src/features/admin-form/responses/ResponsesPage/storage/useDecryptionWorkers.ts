import { useCallback, useEffect, useRef, useState } from 'react'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useFormResponsesCount } from '../../queries'

import { downloadResponseAttachment } from './utils/downloadCsv'
import { EncryptedResponseCsvGenerator } from './utils/EncryptedResponseCsvGenerator.class'
import {
  EncryptedResponsesStreamParams,
  getEncryptedResponsesStream,
  makeWorkerApiAndCleanup,
} from './StorageResponsesService'
import { CleanableDecryptionWorkerApi, CsvRecordStatus } from './types'

const NUM_OF_METADATA_ROWS = 5

const killWorkers = (workers: CleanableDecryptionWorkerApi[]): void => {
  return workers.forEach((worker) => worker.cleanup())
}

export type DownloadEncryptedParams = EncryptedResponsesStreamParams & {
  // The key to decrypt the submission responses.
  secretKey: string
}

const useDecryptionWorkers = () => {
  const [workers, setWorkers] = useState<CleanableDecryptionWorkerApi[]>([])
  const abortControllerRef = useRef(new AbortController())
  const { data: adminForm } = useAdminForm()

  const { refetch } = useFormResponsesCount()

  useEffect(() => {
    const abortController = abortControllerRef.current

    return () => {
      killWorkers(workers)
      abortController.abort()
    }
  }, [workers])

  const downloadEncryptedResponses = useCallback(
    async ({
      downloadAttachments,
      secretKey,
      endDate,
      startDate,
    }: DownloadEncryptedParams) => {
      if (!adminForm) return

      const { data: responsesCount } = await refetch({
        throwOnError: true,
      })
      if (!responsesCount) return
      // Abort any existing downloads if this function is re-invoked.
      abortControllerRef.current.abort()
      if (workers.length) killWorkers(workers)

      // Create a pool of decryption workers
      // If we are downloading attachments, we restrict the number of threads
      // to one to limit resource usage on the client's browser.
      const numWorkers = downloadAttachments
        ? 1
        : window.navigator.hardwareConcurrency || 4
      let errorCount = 0
      let unverifiedCount = 0
      let attachmentErrorCount = 0
      let receivedRecordCount = 0

      const workerPool: CleanableDecryptionWorkerApi[] = []

      for (let i = workerPool.length; i < numWorkers; i++) {
        workerPool.push(makeWorkerApiAndCleanup())
      }

      setWorkers(workerPool)

      const csvGenerator = new EncryptedResponseCsvGenerator(
        responsesCount,
        NUM_OF_METADATA_ROWS,
      )

      const stream = await getEncryptedResponsesStream(
        adminForm._id,
        { downloadAttachments, endDate, startDate },
        abortControllerRef.current,
      )
      const reader = stream.getReader()
      let read: (result: ReadableStreamDefaultReadResult<string>) => void
      const downloadStartTime = performance.now()

      return reader
        .read()
        .then(
          (read = async (result) => {
            if (result.done) return
            try {
              // round-robin scheduling
              const { workerApi } = workerPool[receivedRecordCount % numWorkers]
              const decryptResult = await workerApi.decryptIntoCsv({
                line: result.value,
                secretKey,
                downloadAttachments,
              })

              switch (decryptResult.status) {
                case CsvRecordStatus.Error:
                  errorCount++
                  break
                case CsvRecordStatus.Unverified:
                  unverifiedCount++
                  break
                case CsvRecordStatus.AttachmentError:
                  errorCount++
                  attachmentErrorCount++
                  break
                case CsvRecordStatus.Ok: {
                  try {
                    csvGenerator.addRecord(decryptResult.submissionData)
                    receivedRecordCount++
                  } catch (e) {
                    errorCount++
                    console.error('Error in getResponseInstance', e)
                  }
                  if (downloadAttachments && decryptResult.downloadBlob) {
                    await downloadResponseAttachment(
                      decryptResult.downloadBlob,
                      decryptResult.id,
                    )
                  }
                }
              }
            } catch (e) {
              console.error('Error parsing JSON', e)
            }
            // recurse through the stream
            return reader.read().then(read)
          }),
        )
        .catch((err) => {
          if (!downloadStartTime) {
            // No start time, means did not even start http request.
            // TODO: Google analytics tracking for failure.
            // GTag.downloadNetworkFailure(params, err)
          } else {
            const downloadFailedTime = performance.now()
            const timeDifference = downloadFailedTime - downloadStartTime
            // TODO: Google analytics tracking for failure.
            // GTag.downloadResponseFailure(
            //   params,
            //   numWorkers,
            //   expectedNumResponses,
            //   timeDifference,
            //   err,
            // )
          }

          console.error(
            'Failed to download data, is there a network issue?',
            err,
          )
          killWorkers(workerPool)
          throw err
        })
        .finally(() => {
          const checkComplete = () => {
            // If all the records could not be decrypted
            if (errorCount + unverifiedCount === responsesCount) {
              const failureEndTime = performance.now()
              const timeDifference = failureEndTime - downloadStartTime
              // TODO: Google analytics tracking for partial decrypt
              // failure.
              // GTag.partialDecryptionFailure(
              //   params,
              //   numWorkers,
              //   csvGenerator.length(),
              //   errorCount,
              //   attachmentErrorCount,
              //   timeDifference,
              // )
              killWorkers(workerPool)
              throw new Error(
                JSON.stringify({
                  expectedCount: responsesCount,
                  successCount: csvGenerator.length(),
                  errorCount,
                  unverifiedCount,
                }),
              )
            } else if (
              // All results have been decrypted
              csvGenerator.length() + errorCount + unverifiedCount >=
              responsesCount
            ) {
              killWorkers(workerPool)
              // Generate first three rows of meta-data before download
              csvGenerator.addMetaDataFromSubmission(
                errorCount,
                unverifiedCount,
              )
              csvGenerator.downloadCsv(
                `${adminForm.title}-${adminForm._id}.csv`,
              )

              const downloadEndTime = performance.now()
              const timeDifference = downloadEndTime - downloadStartTime

              // TODO: Google analytics tracking for success.
              // GTag.downloadResponseSuccess(
              //   params,
              //   numWorkers,
              //   csvGenerator.length(),
              //   timeDifference,
              // )

              return {
                expectedCount: responsesCount,
                successCount: csvGenerator.length(),
                errorCount,
                unverifiedCount,
              }
            } else {
              setTimeout(checkComplete, 100)
            }
          }

          checkComplete()
        })
    },
    [adminForm, refetch, workers],
  )

  return { downloadEncryptedResponses }
}

export default useDecryptionWorkers
