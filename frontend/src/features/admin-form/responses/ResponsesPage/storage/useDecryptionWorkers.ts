import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, UseMutationOptions } from 'react-query'
import { datadogLogs } from '@datadog/browser-logs'

import { useAdminForm } from '~features/admin-form/common/queries'
import {
  trackDownloadNetworkFailure,
  trackDownloadResponseFailure,
  trackDownloadResponseStart,
  trackDownloadResponseSuccess,
  trackPartialDecryptionFailure,
} from '~features/analytics/AnalyticsService'
import { useUser } from '~features/user/queries'

import { downloadResponseAttachment } from './utils/downloadCsv'
import { EncryptedResponseCsvGenerator } from './utils/EncryptedResponseCsvGenerator'
import {
  EncryptedResponsesStreamParams,
  getEncryptedResponsesStream,
  makeWorkerApiAndCleanup,
} from './StorageResponsesService'
import {
  CleanableDecryptionWorkerApi,
  CsvRecordStatus,
  DownloadResult,
} from './types'

const NUM_OF_METADATA_ROWS = 5

function timeout(
  ms: number,
  errorMessage = 'Operation timed out',
): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), ms),
  )
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([promise, timeout(ms)])
}

const killWorkers = (workers: CleanableDecryptionWorkerApi[]): void => {
  return workers.forEach((worker) => worker.cleanup())
}

export type DownloadEncryptedParams = EncryptedResponsesStreamParams & {
  // The key to decrypt the submission responses.
  secretKey: string
  // Number of responses to expect to download.
  responsesCount: number
}
interface UseDecryptionWorkersProps {
  onProgress: (progress: number) => void
  mutateProps: UseMutationOptions<
    DownloadResult,
    unknown,
    DownloadEncryptedParams,
    unknown
  >
}

const useDecryptionWorkers = ({
  onProgress,
  mutateProps,
}: UseDecryptionWorkersProps) => {
  const [workers, setWorkers] = useState<CleanableDecryptionWorkerApi[]>([])
  const abortControllerRef = useRef(new AbortController())

  const { data: adminForm } = useAdminForm()
  const { user } = useUser()

  useEffect(() => {
    return () => killWorkers(workers)
  }, [workers])

  useEffect(() => {
    const abortController = abortControllerRef.current
    return () => {
      abortController.abort()
    }
  }, [])

  const downloadEncryptedResponses = useCallback(
    async ({
      responsesCount,
      downloadAttachments,
      secretKey,
      endDate,
      startDate,
    }: DownloadEncryptedParams) => {
      if (!adminForm || !responsesCount) {
        return Promise.resolve({
          expectedCount: 0,
          successCount: 0,
          errorCount: 0,
        })
      }

      abortControllerRef.current.abort()
      const freshAbortController = new AbortController()
      abortControllerRef.current = freshAbortController

      if (workers.length) killWorkers(workers)

      // Create a pool of decryption workers
      // If we are downloading attachments, we restrict the number of threads
      // to one to limit resource usage on the client's browser.
      const numWorkers = window.navigator.hardwareConcurrency || 4
      let errorCount = 0
      let unverifiedCount = 0
      let attachmentErrorCount = 0
      let receivedRecordCount = 0

      const logMeta = {
        action: 'downloadEncryptedReponses',
        formId: adminForm._id,
        formTitle: adminForm.title,
        downloadAttachments: downloadAttachments,
        num_workers: numWorkers,
        expectedNumSubmissions: NUM_OF_METADATA_ROWS,
        adminId: user?._id,
      }
      // Trigger analytics here before starting decryption worker
      trackDownloadResponseStart(adminForm, numWorkers, NUM_OF_METADATA_ROWS)
      datadogLogs.logger.info('Download response start', {
        meta: {
          ...logMeta,
        },
      })

      const workerPool: CleanableDecryptionWorkerApi[] = []
      const idleWorkers: number[] = []

      for (let i = workerPool.length; i < numWorkers; i++) {
        workerPool.push(makeWorkerApiAndCleanup())
        idleWorkers.push(i)
      }

      setWorkers(workerPool)

      const csvGenerator = new EncryptedResponseCsvGenerator(
        responsesCount,
        NUM_OF_METADATA_ROWS,
      )

      const stream = await getEncryptedResponsesStream(
        adminForm._id,
        { downloadAttachments, endDate, startDate },
        freshAbortController,
      )

      let progress = 0

      // Invoking this callback means that idleWorkers is not empty
      const processTask = async (value: string, workerIdx: number) => {
        const { workerApi } = workerPool[workerIdx]

        const decryptResult = await workerApi.decryptIntoCsv({
          line: value,
          secretKey,
          downloadAttachments,
          formId: adminForm._id,
          hostOrigin: window.location.origin,
        })

        switch (decryptResult.status) {
          case CsvRecordStatus.Error:
            errorCount++
            console.log({ error: decryptResult })
            break
          case CsvRecordStatus.Unverified:
            unverifiedCount++
            console.log({ unverified: decryptResult })
            break
          case CsvRecordStatus.AttachmentError:
            errorCount++
            attachmentErrorCount++
            console.log({ 'attachment error': decryptResult })
            break
          case CsvRecordStatus.Unknown:
            errorCount++
            console.log({ unknown: decryptResult })
            break
          case CsvRecordStatus.Ok:
            try {
              csvGenerator.addRecord(decryptResult.submissionData)
              receivedRecordCount++
            } catch (e) {
              errorCount++
              console.error('Error in getResponseInstance', e)
            }
            if (downloadAttachments && decryptResult.downloadBlob) {
              downloadResponseAttachment(
                decryptResult.downloadBlob,
                decryptResult.id,
              ).catch((error) => {
                console.error('Error downloading attachment:', error)
              })
            }
            break
        }
        return workerIdx
      }

      // const workerPromises: Promise<void>[] = []

      // for (let i = 0; i < workerPool.length; ++i) {
      //   const { workerApi } = workerPool[i]
      //   const { done, value } = await reader.read()
      //   if (done) break
      //   workerPromises.push(workerApi.decryptIntoCsv(value))
      // }
      // implement the ringbuf.js
      // Start enqueuing the work

      // Promise.all(workerPromises)

      // This algorithm performance will degrade to a staircase IF the time taken for
      // decryption of each response is short (< 10ms). But this is ok.
      const readAndQueueTasks = async () => {
        const reader = stream.getReader()
        let pendingTasks: Promise<number>[] = []
        let timeoutCount = 0

        try {
          while (progress < responsesCount) {
            const { done, value } = await reader.read()
            if (done) break

            progress += 1
            onProgress(progress)

            while (idleWorkers.length === 0) {
              // We set a "timeout" for each worker. Promise.any doesn't work here
              // since we want to prevent it from degrading into a staircase.
              // We simply do a one pass through the pendingTasks, if any of the
              // tasks are done, we push the workerIdx to idleWorkers.
              const finishedTasks: number[] = []
              for (let i = 0; i < pendingTasks.length; i++) {
                try {
                  const freedWorkerIdx = await withTimeout(pendingTasks[i], 100)
                  idleWorkers.push(freedWorkerIdx)
                  finishedTasks.push(i)
                } catch (e) {
                  // If it's a timeout error, we'll just continue to the next task
                  if (
                    e instanceof Error &&
                    e.message === 'Operation timed out'
                  ) {
                    timeoutCount++
                    continue
                  }
                  // For other errors, we might want to handle them differently
                  console.error(`Error processing task: ${e}`)
                }
              }
              pendingTasks = pendingTasks.filter(
                (_, i) => !finishedTasks.includes(i),
              )
            }

            const workerIdx = idleWorkers.shift()!
            pendingTasks.push(processTask(value, workerIdx))
          }
          await Promise.all(pendingTasks)
        } catch (e) {
          console.error('Error in readAndQueueTasks', e)
        } finally {
          console.log(
            `Average timeout per iteration: ${timeoutCount / progress}`,
          )
          console.log(`Total timeouts: ${timeoutCount}`)
        }
      }
      const downloadStartTime = performance.now()

      try {
        await readAndQueueTasks()
        if (
          errorCount +
            unverifiedCount +
            attachmentErrorCount +
            receivedRecordCount !==
          responsesCount
        ) {
          console.warn({
            'not all responses were decrypted': {
              errorCount,
              unverifiedCount,
              attachmentErrorCount,
              receivedRecordCount,
              responsesCount,
            },
          })
        }
        // Final processing and CSV generation
        csvGenerator.addMetaDataFromSubmission(errorCount, unverifiedCount)
        csvGenerator.downloadCsv(`${adminForm.title}-${adminForm._id}.csv`)

        const downloadEndTime = performance.now()
        const timeDifference = downloadEndTime - downloadStartTime
        console.log({
          timeDifference,
          attachmentErrorCount,
          errorCount,
          unverifiedCount,
          receivedRecordCount,
        })

        datadogLogs.logger.info('Download response success', {
          meta: {
            ...logMeta,
            duration: timeDifference,
          },
        })

        trackDownloadResponseSuccess(
          adminForm,
          numWorkers,
          NUM_OF_METADATA_ROWS,
          timeDifference,
        )
      } catch (err) {
        // Error handling
        console.error('Failed to download data:', err)
        killWorkers(workerPool)
        throw err
      } finally {
        // Cleanup
        killWorkers(workerPool)
      }

      return {
        expectedCount: responsesCount,
        successCount: csvGenerator.length(),
        errorCount,
        unverifiedCount,
      }

      // let read: (result: ReadableStreamDefaultReadResult<string>) => void

      // return new Promise<DownloadResult>((resolve, reject) => {
      //   reader
      //     .read()
      //     .then(
      //       (read = async (result) => {
      //         if (result.done) return
      //         try {
      //           // round-robin scheduling
      //           const { workerApi } =
      //             workerPool[receivedRecordCount % numWorkers]
      //           const decryptResult = await workerApi.decryptIntoCsv({
      //             line: result.value,
      //             secretKey,
      //             downloadAttachments,
      //             formId: adminForm._id,
      //             hostOrigin: window.location.origin,
      //           })
      //           progress += 1
      //           onProgress(progress)

      //           switch (decryptResult.status) {
      //             case CsvRecordStatus.Error:
      //               errorCount++
      //               break
      //             case CsvRecordStatus.Unverified:
      //               unverifiedCount++
      //               break
      //             case CsvRecordStatus.AttachmentError:
      //               errorCount++
      //               attachmentErrorCount++
      //               break
      //             case CsvRecordStatus.Ok: {
      //               try {
      //                 csvGenerator.addRecord(decryptResult.submissionData)
      //                 receivedRecordCount++
      //               } catch (e) {
      //                 errorCount++
      //                 console.error('Error in getResponseInstance', e)
      //               }
      //               if (downloadAttachments && decryptResult.downloadBlob) {
      //                 await downloadResponseAttachment(
      //                   decryptResult.downloadBlob,
      //                   decryptResult.id,
      //                 )
      //               }
      //             }
      //           }
      //         } catch (e) {
      //           console.error('Error parsing JSON', e)
      //         }
      //         // recurse through the stream
      //         return reader.read().then(read)
      //       }),
      //     )
      //     .catch((err) => {
      //       if (!downloadStartTime) {
      //         // No start time, means did not even start http request.
      //         datadogLogs.logger.info('Download network failure', {
      //           meta: {
      //             ...logMeta,
      //             error: {
      //               message: err.message,
      //               name: err.name,
      //               stack: err.stack,
      //             },
      //           },
      //         })
      //         trackDownloadNetworkFailure(adminForm, err)
      //       } else {
      //         const downloadFailedTime = performance.now()
      //         const timeDifference = downloadFailedTime - downloadStartTime

      //         datadogLogs.logger.info('Download response failure', {
      //           meta: {
      //             ...logMeta,
      //             duration: timeDifference,
      //             error: {
      //               message: err.message,
      //               name: err.name,
      //               stack: err.stack,
      //             },
      //           },
      //         })

      //         trackDownloadResponseFailure(
      //           adminForm,
      //           numWorkers,
      //           NUM_OF_METADATA_ROWS,
      //           timeDifference,
      //           err,
      //         )
      //       }

      //       console.error(
      //         'Failed to download data, is there a network issue?',
      //         err,
      //       )
      //       killWorkers(workerPool)
      //       reject(err)
      //     })
      //     .finally(() => {
      //       const checkComplete = () => {
      //         // If all the records could not be decrypted
      //         if (errorCount + unverifiedCount === responsesCount) {
      //           const failureEndTime = performance.now()
      //           const timeDifference = failureEndTime - downloadStartTime

      //           datadogLogs.logger.info('Partial decryption failure', {
      //             meta: {
      //               ...logMeta,
      //               duration: timeDifference,
      //               error_count: errorCount,
      //               unverified_count: unverifiedCount,
      //               attachment_error_count: attachmentErrorCount,
      //             },
      //           })

      //           trackPartialDecryptionFailure(
      //             adminForm,
      //             numWorkers,
      //             csvGenerator.length(),
      //             timeDifference,
      //             errorCount,
      //             attachmentErrorCount,
      //           )

      //           killWorkers(workerPool)
      //           resolve({
      //             expectedCount: responsesCount,
      //             successCount: csvGenerator.length(),
      //             errorCount,
      //             unverifiedCount,
      //           })
      //         } else if (
      //           // All results have been decrypted
      //           csvGenerator.length() + errorCount + unverifiedCount >=
      //           responsesCount
      //         ) {
      //           killWorkers(workerPool)
      //           // Generate first three rows of meta-data before download
      //           csvGenerator.addMetaDataFromSubmission(
      //             errorCount,
      //             unverifiedCount,
      //           )
      //           csvGenerator.downloadCsv(
      //             `${adminForm.title}-${adminForm._id}.csv`,
      //           )

      //           const downloadEndTime = performance.now()
      //           const timeDifference = downloadEndTime - downloadStartTime

      //           datadogLogs.logger.info('Download response success', {
      //             meta: {
      //               ...logMeta,
      //               duration: timeDifference,
      //             },
      //           })

      //           trackDownloadResponseSuccess(
      //             adminForm,
      //             numWorkers,
      //             NUM_OF_METADATA_ROWS,
      //             timeDifference,
      //           )

      //           resolve({
      //             expectedCount: responsesCount,
      //             successCount: csvGenerator.length(),
      //             errorCount,
      //             unverifiedCount,
      //           })
      //         } else {
      //           setTimeout(checkComplete, 100)
      //         }
      //       }

      //       checkComplete()
      //     })
      // })
    },
    [adminForm, onProgress, user?._id, workers],
  )

  const handleExportCsvMutation = useMutation(
    (params: DownloadEncryptedParams) => downloadEncryptedResponses(params),
    mutateProps,
  )

  const abortDecryption = useCallback(() => {
    abortControllerRef.current.abort()
    handleExportCsvMutation.reset()
    killWorkers(workers)
  }, [handleExportCsvMutation, workers])

  return { handleExportCsvMutation, abortDecryption }
}

export default useDecryptionWorkers
