import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, UseMutationOptions } from 'react-query'
import { datadogLogs } from '@datadog/browser-logs'
import { useFeature } from '@growthbook/growthbook-react'

import { waitForMs } from '~utils/waitForMs'

import { useAdminForm } from '~features/admin-form/common/queries'
import {
  trackDownloadNetworkFailure,
  trackDownloadResponseFailure,
  trackDownloadResponseStart,
  trackDownloadResponseSuccess,
  trackPartialDecryptionFailure,
} from '~features/analytics/AnalyticsService'
import { useUser } from '~features/user/queries'

import {
  downloadResponseAttachment,
  downloadResponseAttachmentURL,
} from './utils/downloadCsv'
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

// We will download attachments in convoys of 5
// This is to prevent the script from downloading too many attachments at once
// which could cause it to block downloads.
const ATTACHMENT_DOWNLOAD_CONVOY_SIZE = 5
const ATTACHMENT_DOWNLOAD_CONVOY_MINIMUM_SEPARATION_TIME = 1000

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

const useDecryptionWorkers = ({
  onProgress,
  mutateProps,
}: UseDecryptionWorkersProps) => {
  const [workers, setWorkers] = useState<CleanableDecryptionWorkerApi[]>([])
  const abortControllerRef = useRef(new AbortController())

  const { data: adminForm } = useAdminForm()
  const { user } = useUser()

  const isDev = process.env.NODE_ENV === 'development'

  const fasterDownloadsFeature = useFeature('faster-downloads')
  const fasterDownloads = fasterDownloadsFeature.on || isDev

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
      const numWorkers = downloadAttachments
        ? 1
        : window.navigator.hardwareConcurrency || 4
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
        freshAbortController,
      )
      const reader = stream.getReader()
      let read: (result: ReadableStreamDefaultReadResult<string>) => void
      const downloadStartTime = performance.now()

      let progress = 0
      let timeSinceLastXAttachmentDownload = 0

      let totalBlobDownloadTime = 0

      return new Promise<DownloadResult>((resolve, reject) => {
        reader
          .read()
          .then(
            (read = async (result) => {
              if (result.done) return
              try {
                // round-robin scheduling
                const { workerApi } =
                  workerPool[receivedRecordCount % numWorkers]
                const decryptResult = await workerApi.decryptIntoCsv(
                  {
                    line: result.value,
                    secretKey,
                    downloadAttachments,
                    formId: adminForm._id,
                    hostOrigin: window.location.origin,
                  },
                  fasterDownloads,
                )
                progress += 1
                onProgress(progress)

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
                      // Ensure attachments downloads are spaced out to avoid browser blocking downloads
                      if (progress % ATTACHMENT_DOWNLOAD_CONVOY_SIZE === 0) {
                        const now = new Date().getTime()
                        const elapsedSinceXDownloads =
                          now - timeSinceLastXAttachmentDownload

                        const waitTime = Math.max(
                          0,
                          ATTACHMENT_DOWNLOAD_CONVOY_MINIMUM_SEPARATION_TIME -
                            elapsedSinceXDownloads,
                        )
                        if (waitTime > 0) {
                          await waitForMs(waitTime)
                        }
                        timeSinceLastXAttachmentDownload = now
                      }
                      const startTime = performance.now()
                      await downloadResponseAttachment(
                        decryptResult.downloadBlob,
                        decryptResult.id,
                      )
                      const delta = performance.now() - startTime
                      totalBlobDownloadTime += delta
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
              datadogLogs.logger.info('Download network failure', {
                meta: {
                  ...logMeta,
                  error: {
                    message: err.message,
                    name: err.name,
                    stack: err.stack,
                  },
                },
              })
              trackDownloadNetworkFailure(adminForm, err)
            } else {
              const downloadFailedTime = performance.now()
              const timeDifference = downloadFailedTime - downloadStartTime

              datadogLogs.logger.info('Download response failure', {
                meta: {
                  ...logMeta,
                  duration: timeDifference,
                  error: {
                    message: err.message,
                    name: err.name,
                    stack: err.stack,
                  },
                },
              })

              trackDownloadResponseFailure(
                adminForm,
                numWorkers,
                NUM_OF_METADATA_ROWS,
                timeDifference,
                err,
              )
            }

            console.error(
              'Failed to download data, is there a network issue?',
              err,
            )
            killWorkers(workerPool)
            reject(err)
          })
          .finally(() => {
            const checkComplete = () => {
              // If all the records could not be decrypted
              if (errorCount + unverifiedCount === responsesCount) {
                const failureEndTime = performance.now()
                const timeDifference = failureEndTime - downloadStartTime

                datadogLogs.logger.info('Partial decryption failure', {
                  meta: {
                    ...logMeta,
                    duration: timeDifference,
                    error_count: errorCount,
                    unverified_count: unverifiedCount,
                    attachment_error_count: attachmentErrorCount,
                  },
                })

                trackPartialDecryptionFailure(
                  adminForm,
                  numWorkers,
                  csvGenerator.length(),
                  timeDifference,
                  errorCount,
                  attachmentErrorCount,
                )

                killWorkers(workerPool)
                resolve({
                  expectedCount: responsesCount,
                  successCount: csvGenerator.length(),
                  errorCount,
                  unverifiedCount,
                })
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

                console.log({
                  'Time it took to download blob url':
                    totalBlobDownloadTime / csvGenerator.length(),
                })

                resolve({
                  expectedCount: responsesCount,
                  successCount: csvGenerator.length(),
                  errorCount,
                  unverifiedCount,
                })
              } else {
                setTimeout(checkComplete, 100)
              }
            }

            checkComplete()
          })
      })
    },
    [adminForm, onProgress, user?._id, workers, fasterDownloads],
  )

  const downloadEncryptedResponsesFaster = useCallback(
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

      console.log('Faster downloads is enabled ⚡')

      abortControllerRef.current.abort()
      const freshAbortController = new AbortController()
      abortControllerRef.current = freshAbortController

      if (workers.length) killWorkers(workers)

      const numWorkers = window.navigator.hardwareConcurrency || 4
      let errorCount = 0
      let unverifiedCount = 0
      let attachmentErrorCount = 0
      let unknownStatusCount = 0

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

      let totalBlobDownloadTime = 0

      const processTask = async (value: string, workerIdx: number) => {
        const { workerApi } = workerPool[workerIdx]

        const decryptResult = await workerApi.decryptIntoCsv(
          {
            line: value,
            secretKey,
            downloadAttachments,
            formId: adminForm._id,
            hostOrigin: window.location.origin,
          },
          fasterDownloads,
        )

        switch (decryptResult.status) {
          case CsvRecordStatus.Ok:
            try {
              csvGenerator.addRecord(decryptResult.submissionData)
            } catch (e) {
              errorCount++
              console.error('Error in getResponseInstance', e)
            }

            // It's fine to hog on to the worker here while waiting for the browser
            // rate limit to pass. If decryption is fast, we would wait regardless.
            // If decryption is slow, we won't hit rate limits.
            if (downloadAttachments && decryptResult.downloadBlobURL) {
              const startTime = performance.now()
              await downloadResponseAttachmentURL(
                decryptResult.downloadBlobURL,
                decryptResult.id,
              )
              URL.revokeObjectURL(decryptResult.downloadBlobURL!)
              const delta = performance.now() - startTime
              totalBlobDownloadTime += delta
            }
            break
          case CsvRecordStatus.Unknown:
            unknownStatusCount++
            break
          case CsvRecordStatus.Error:
            errorCount++
            break
          case CsvRecordStatus.AttachmentError:
            errorCount++
            attachmentErrorCount++
            break
          case CsvRecordStatus.Unverified:
            unverifiedCount++
            break
          default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _: never = decryptResult.status
            throw new Error('Invalid decryptResult status encountered.')
          }
        }
        return workerIdx
      }

      const readAndQueueTask = async () => {
        const reader = stream.getReader()
        let progress = 0
        let pendingTasks: Promise<number>[] = []

        try {
          while (progress < responsesCount) {
            const { done, value } = await reader.read()
            if (done) break

            progress += 1
            onProgress(progress)

            while (idleWorkers.length === 0) {
              const finishedTasks: number[] = []
              for (let i = 0; i < pendingTasks.length; i++) {
                try {
                  const freedWorkerIdx = await withTimeout(pendingTasks[i], 10)
                  idleWorkers.push(freedWorkerIdx)
                  finishedTasks.push(i)
                } catch (e) {
                  if (
                    e instanceof Error &&
                    e.message === 'Operation timed out'
                  ) {
                    continue
                  }
                  console.error(`Error in task ${i}`, e)
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
          console.error('Error reading stream', e)
        } finally {
          reader.releaseLock()
        }
      }

      const downloadStartTime = performance.now()

      return new Promise<DownloadResult>((resolve, reject) => {
        readAndQueueTask()
          .catch((err) => {
            if (!downloadStartTime) {
              // No start time, means did not even start http request.
              datadogLogs.logger.info('Download network failure', {
                meta: {
                  ...logMeta,
                  error: {
                    message: err.message,
                    name: err.name,
                    stack: err.stack,
                  },
                },
              })

              trackDownloadNetworkFailure(adminForm, err)
            } else {
              const downloadFailedTime = performance.now()
              const timeDifference = downloadFailedTime - downloadStartTime

              datadogLogs.logger.info('Download response failure', {
                meta: {
                  ...logMeta,
                  duration: timeDifference,
                  error: {
                    message: err.message,
                    name: err.name,
                    stack: err.stack,
                  },
                },
              })

              trackDownloadResponseFailure(
                adminForm,
                numWorkers,
                NUM_OF_METADATA_ROWS,
                timeDifference,
                err,
              )

              console.error(
                'Failed to download data, is there a network issue?',
                err,
              )
              killWorkers(workerPool)
              reject(err)
            }
          })
          .finally(() => {
            const checkComplete = () => {
              // If all the records could not be decrypted
              if (errorCount + unverifiedCount === responsesCount) {
                const failureEndTime = performance.now()
                // todo: check the timedifference redeclaration
                const timeDifference = failureEndTime - downloadStartTime

                datadogLogs.logger.info('Partial decryption failure', {
                  meta: {
                    ...logMeta,
                    duration: timeDifference,
                    error_count: errorCount,
                    unverified_count: unverifiedCount,
                    attachment_error_count: attachmentErrorCount,
                    unknown_status_count: unknownStatusCount,
                  },
                })

                trackPartialDecryptionFailure(
                  adminForm,
                  numWorkers,
                  csvGenerator.length(),
                  timeDifference,
                  errorCount,
                  attachmentErrorCount,
                )

                killWorkers(workerPool)
                resolve({
                  expectedCount: responsesCount,
                  successCount: csvGenerator.length(),
                  errorCount,
                  unverifiedCount,
                })
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

                console.log({
                  'Time it took to download blob url':
                    totalBlobDownloadTime / csvGenerator.length(),
                })

                resolve({
                  expectedCount: responsesCount,
                  successCount: csvGenerator.length(),
                  errorCount,
                  unverifiedCount,
                })
              } else {
                setTimeout(checkComplete, 100)
              }
            }

            checkComplete()
          })
      })
    },
    [adminForm, onProgress, user?._id, workers, fasterDownloads],
  )

  const handleExportCsvMutation = useMutation(
    (params: DownloadEncryptedParams) =>
      fasterDownloads
        ? downloadEncryptedResponsesFaster(params)
        : downloadEncryptedResponses(params),
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
