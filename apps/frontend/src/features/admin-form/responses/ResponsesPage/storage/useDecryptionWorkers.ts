import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, UseMutationOptions } from 'react-query'
import { datadogLogs } from '@datadog/browser-logs'
import saveAs from 'file-saver'
import JSZip from 'jszip'

import { waitForMs } from '~utils/waitForMs'

import { useAdminForm } from '~features/admin-form/common/queries'
import {
  trackDownloadNetworkFailure,
  trackDownloadResponseFailure,
  trackDownloadResponseStart,
  trackDownloadResponseSuccess,
  trackPartialDecryptionFailure,
} from '~features/analytics/AnalyticsService'
import { getVisibleResponses } from '~features/logic/utils'
import { useUser } from '~features/user/queries'

import { generateResponsePdfBlob } from '../../IndividualResponsePage/utils/generateResponsePdf'

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
  DecryptedData,
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
  // Used to determine if we should add MRF related columns to the CSV.
  isMrf: boolean
  isDownloadCsv: boolean
  isDownloadPdf: boolean
}
interface UseDecryptionWorkersProps {
  onDecryptionProgress: React.Dispatch<React.SetStateAction<number>>
  onPdfGenerationProgress: React.Dispatch<React.SetStateAction<number>>
  mutateProps: UseMutationOptions<
    DownloadResult,
    unknown,
    DownloadEncryptedParams,
    unknown
  >
}

const useDecryptionWorkers = ({
  onDecryptionProgress,
  onPdfGenerationProgress,
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
      isDownloadCsv,
      isDownloadPdf,
      secretKey,
      endDate,
      startDate,
      isMrf,
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

      let currentSubmissionIndex = 0 // used to iterate through the workers
      let attachmentsToSaveCount = 0 // used for scheduling delays between attachment zip file saves
      const csvOutcomeCounts = {
        errorCount: 0,
        unverifiedCount: 0,
        attachmentErrorCount: 0,
      }
      const decryptionOutcomeCounts = {
        decryptionSuccessCount: 0,
        decryptionFailureCount: 0,
      }

      const logMeta = {
        action: 'downloadEncryptedReponses',
        formId: adminForm._id,
        formTitle: adminForm.title,
        downloadAttachments,
        num_workers: numWorkers,
        expectedNumSubmissions: responsesCount,
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

      const csvGenerator = isDownloadCsv
        ? new EncryptedResponseCsvGenerator(
            responsesCount,
            NUM_OF_METADATA_ROWS,
            isMrf,
          )
        : undefined

      const stream = await getEncryptedResponsesStream(
        adminForm._id,
        { downloadAttachments, endDate, startDate },
        freshAbortController,
      )
      const reader = stream.getReader()
      let read: (result: ReadableStreamReadResult<string>) => void
      const downloadStartTime = performance.now()
      const submissionDecryptPromises: Promise<DecryptedData>[] = []

      let timeSinceLastXAttachmentDownload = 0
      // Promise chain as a makeshift queue which serializes `saveAs()` calls to prevent dropped downloads
      let saveQueue: Promise<void> = Promise.resolve()

      await reader.read().then(
        (read = async (result) => {
          if (result.done) return
          const { workerApi } = workerPool[currentSubmissionIndex % numWorkers]
          // Step 1: Use worker to decrypt the submission (and download and decrypt attachments if needed).
          submissionDecryptPromises.push(
            workerApi
              .getDecryptedData({
                isDownloadAttachments: downloadAttachments,
                isDownloadCsv,
                submissionStreamDtoString: result.value,
                secretKey,
                formId: adminForm._id,
                hostOrigin: window.location.origin,
              })
              // Step 2: Update the Csv record status based on the decryption result.
              .then(async (decryptResult) => {
                // Count general decryption successes and failures
                const {
                  isDecryptionSuccessful,
                  isDownloadAndDecryptSubmissionAttachmentsSuccessful,
                } = decryptResult.status

                const decryptionFailed =
                  !isDecryptionSuccessful ||
                  (downloadAttachments &&
                    !isDownloadAndDecryptSubmissionAttachmentsSuccessful)

                if (decryptionFailed) {
                  decryptionOutcomeCounts.decryptionFailureCount++
                } else {
                  decryptionOutcomeCounts.decryptionSuccessCount++
                }

                // Count number of csv success and failures
                if (isDownloadCsv && csvGenerator) {
                  const { materializedCsvRecord } = decryptResult
                  switch (materializedCsvRecord?.status) {
                    case CsvRecordStatus.Error:
                      csvOutcomeCounts.errorCount++
                      break
                    case CsvRecordStatus.Unverified:
                      csvOutcomeCounts.unverifiedCount++
                      break
                    case CsvRecordStatus.AttachmentError:
                      csvOutcomeCounts.errorCount++
                      csvOutcomeCounts.attachmentErrorCount++
                      break
                    case CsvRecordStatus.Ok: {
                      try {
                        csvGenerator.addRecord(
                          materializedCsvRecord.submissionData,
                        )
                      } catch (e) {
                        csvOutcomeCounts.errorCount++
                        console.error('Error in getResponseInstance', e)
                      }
                    }
                  }
                }
                return decryptResult
              })
              // Step 3: Save the downloaded and decrypted attachment blobs for each submission (if required).
              // This step is done with delays in between groups of files to space out downloads to avoid browser blocking downloads.
              .then(async (decryptResult) => {
                if (!downloadAttachments) {
                  return decryptResult
                }
                // Chain onto the queue so saves run one at a time
                saveQueue = saveQueue.then(async () => {
                  if (
                    !decryptResult.attachmentDownloadBlob ||
                    !decryptResult.parsedSubmission?._id
                  ) {
                    return
                  }
                  attachmentsToSaveCount += 1

                  // Ensure attachments downloads are spaced out to avoid browser blocking downloads
                  if (
                    attachmentsToSaveCount % ATTACHMENT_DOWNLOAD_CONVOY_SIZE ===
                    0
                  ) {
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
                  await downloadResponseAttachment(
                    decryptResult.attachmentDownloadBlob,
                    decryptResult.parsedSubmission._id,
                  )
                })
                return saveQueue.then(() => decryptResult)
              })
              // Step 4: Update the progress bar only once the attachments for the decrypted submission have been downloaded (if needed).
              .finally(() => {
                onDecryptionProgress(
                  (prevDecryptionProgress) => prevDecryptionProgress + 1,
                )
              }),
          )
          currentSubmissionIndex += 1 // used to assign the next submission to the next worker
          return reader.read().then(read)
        }),
      )

      return new Promise<DownloadResult>((resolve, reject) => {
        // Step 1: Decrypt all submissions and their attachments (into blobs), add the submissions into the csv object and save the attachments into user's computer.
        Promise.all(submissionDecryptPromises)
          // Step 2: Save the PDFs for each submission into a zip file.
          .then(async (decryptResults) => {
            if (isDownloadPdf) {
              const pdfZip = new JSZip()
              for (const decryptResult of decryptResults) {
                if (freshAbortController.signal.aborted) {
                  return
                }
                const { parsedSubmission, decryptedResponses } = decryptResult
                if (
                  decryptedResponses !== undefined &&
                  parsedSubmission !== undefined
                ) {
                  const { _id: refNo, created: submissionTime } =
                    parsedSubmission
                  const { pdfBlob, pdfTitle } = await generateResponsePdfBlob({
                    form: adminForm,
                    submission: {
                      refNo,
                      submissionTime,
                      responses: getVisibleResponses(decryptedResponses, {
                        formFields: adminForm.form_fields,
                        formLogics: adminForm.form_logics,
                      }),
                    },
                  })
                  pdfZip.file(pdfTitle, pdfBlob)
                }
                onPdfGenerationProgress(
                  (prevPdfGenerationProgress) => prevPdfGenerationProgress + 1,
                )
              }
              await pdfZip
                .generateAsync({ type: 'blob' })
                .then(function (content) {
                  saveAs(
                    content,
                    `${adminForm.title}-formId_${adminForm._id}-response_pdfs.zip`,
                  )
                })
            }
          })
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
          // Step 2: Generate the actual CSV file from the csv object.
          .finally(() => {
            if (freshAbortController.signal.aborted) {
              return
            }
            const checkComplete = () => {
              if (!isDownloadCsv || !csvGenerator) {
                killWorkers(workerPool)
                resolve({
                  expectedCount: responsesCount,
                  successCount: decryptionOutcomeCounts.decryptionSuccessCount,
                  errorCount: decryptionOutcomeCounts.decryptionFailureCount,
                  unverifiedCount: 0, // RATIONALE: For non-CSV downloads, no need to verify fields
                })
                return
              }
              // If all the records could not be decrypted
              if (
                csvOutcomeCounts.errorCount +
                  csvOutcomeCounts.unverifiedCount ===
                responsesCount
              ) {
                const failureEndTime = performance.now()
                const timeDifference = failureEndTime - downloadStartTime

                datadogLogs.logger.info('Partial decryption failure', {
                  meta: {
                    ...logMeta,
                    duration: timeDifference,
                    error_count: csvOutcomeCounts.errorCount,
                    unverified_count: csvOutcomeCounts.unverifiedCount,
                    attachment_error_count:
                      csvOutcomeCounts.attachmentErrorCount,
                  },
                })

                trackPartialDecryptionFailure(
                  adminForm,
                  numWorkers,
                  csvGenerator.length(),
                  timeDifference,
                  csvOutcomeCounts.errorCount,
                  csvOutcomeCounts.attachmentErrorCount,
                )

                killWorkers(workerPool)
                resolve({
                  expectedCount: responsesCount,
                  successCount: csvGenerator.length(),
                  errorCount: csvOutcomeCounts.errorCount,
                  unverifiedCount: csvOutcomeCounts.unverifiedCount,
                })
              } else if (
                // All results have been decrypted
                csvGenerator.length() +
                  csvOutcomeCounts.errorCount +
                  csvOutcomeCounts.unverifiedCount >=
                responsesCount
              ) {
                killWorkers(workerPool)
                // Generate first three rows of meta-data before download
                csvGenerator.addMetaDataFromSubmission(
                  csvOutcomeCounts.errorCount,
                  csvOutcomeCounts.unverifiedCount,
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

                resolve({
                  expectedCount: responsesCount,
                  successCount: csvGenerator.length(),
                  errorCount: csvOutcomeCounts.errorCount,
                  unverifiedCount: csvOutcomeCounts.unverifiedCount,
                })
              } else {
                setTimeout(checkComplete, 100)
              }
            }
            checkComplete()
          })
      })
    },
    [
      adminForm,
      onDecryptionProgress,
      onPdfGenerationProgress,
      user?._id,
      workers,
    ],
  )

  const handleBulkDownloadMutation = useMutation(
    (params: DownloadEncryptedParams) => downloadEncryptedResponses(params),
    mutateProps,
  )

  const abortDecryption = useCallback(() => {
    abortControllerRef.current.abort()
    handleBulkDownloadMutation.reset()
    killWorkers(workers)
  }, [handleBulkDownloadMutation, workers])

  return { handleBulkDownloadMutation, abortDecryption }
}

export default useDecryptionWorkers
