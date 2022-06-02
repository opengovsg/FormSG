import { useCallback, useEffect, useState } from 'react'

import { useFormResponsesCount } from '../../../queries'
import { useStorageResponsesContext } from '../StorageResponsesContext'
import {
  EncryptedResponsesStreamParams,
  getEncryptedResponsesStream,
  makeWorkerApiAndCleanup,
} from '../StorageResponsesService'
import { CleanableDecryptionWorkerApi, CsvRecordStatus } from '../types'
import { EncryptedResponseCsvGenerator } from '../utils/CsvGenerator.class'
import { downloadResponseAttachment } from '../utils/downloadCsv'

const NUM_OF_METADATA_ROWS = 5

const killWorkers = (workers: CleanableDecryptionWorkerApi[]): void => {
  return workers.forEach((worker) => worker.cleanup())
}

const useDecryptionWorkers = () => {
  const { downloadParams } = useStorageResponsesContext()
  const [workers, setWorkers] = useState<CleanableDecryptionWorkerApi[]>([])

  const { refetch } = useFormResponsesCount()

  useEffect(() => {
    return () => killWorkers(workers)
  }, [workers])

  const downloadEncryptedResponses = useCallback(
    async (queryParams: EncryptedResponsesStreamParams) => {
      if (!downloadParams) return
      const { formId, formTitle, secretKey } = downloadParams
      const { data: responsesCount } = await refetch({
        throwOnError: true,
      })
      if (!responsesCount) return

      const downloadAbortController = new AbortController()
      if (workers.length) killWorkers(workers)

      // Create a pool of decryption workers
      // If we are downloading attachments, we restrict the number of threads
      // to one to limit resource usage on the client's browser.
      const numWorkers = queryParams.downloadAttachments
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
        formId,
        queryParams,
        downloadAbortController,
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
                downloadAttachments: queryParams.downloadAttachments,
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
                  if (
                    queryParams.downloadAttachments &&
                    decryptResult.downloadBlob
                  ) {
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
            // GTag.downloadNetworkFailure(params, err)
          } else {
            const downloadFailedTime = performance.now()
            const timeDifference = downloadFailedTime - downloadStartTime
            // Google analytics tracking for failure.
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
              // Google analytics tracking for partial decrypt
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
              csvGenerator.downloadCsv(`${formTitle}-${formId}.csv`)

              const downloadEndTime = performance.now()
              const timeDifference = downloadEndTime - downloadStartTime

              // Google analytics tracking for success.
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
    [downloadParams, refetch, workers],
  )

  return { downloadEncryptedResponses }
}

export default useDecryptionWorkers
