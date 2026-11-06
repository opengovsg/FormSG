import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, UseMutationOptions } from 'react-query'
import { datadogLogs } from '@datadog/browser-logs'
import { useFeatureIsOn } from '@growthbook/growthbook-react'
import { transfer } from 'comlink'
import saveAs from 'file-saver'
import JSZip from 'jszip'

import { featureFlags } from 'formsg-shared/constants'

import { env } from '~/env'

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
  killWorkers,
  makeWorkerApiAndCleanup,
} from '../../common/utils/decryptionWorker'
import { generateResponsePdfBlob } from '../../IndividualResponsePage/utils/generateResponsePdf'

import { CsvExportView } from './utils/csvExportView'
import { downloadResponseAttachment } from './utils/downloadCsv'
import { EncryptedResponseCsvGenerator } from './utils/EncryptedResponseCsvGenerator'
import {
  getResponseFolderName,
  removeInvalidFileNameCharacters,
} from './utils/responseFolderName'
import { clearStagedZips } from './utils/zipStaging'
import { ZipEntry } from './utils/ZipStreamWriter'
import {
  CleanableZipWorkerApi,
  makeZipWorkerApiAndCleanup,
} from './utils/zipWorker'
import {
  EncryptedResponsesStreamParams,
  getEncryptedResponsesStream,
} from './StorageResponsesService'
import {
  CleanableDecryptionWorkerApi,
  CsvRecordStatus,
  DecryptedData,
  DecryptedSubmissionData,
  DownloadResult,
} from './types'

const NUM_OF_METADATA_ROWS = 5

// We will download attachments in convoys of 5
// This is to prevent the script from downloading too many attachments at once
// which could cause it to block downloads.
const ATTACHMENT_DOWNLOAD_CONVOY_SIZE = 5
const ATTACHMENT_DOWNLOAD_CONVOY_MINIMUM_SEPARATION_TIME = 1000

export type DownloadEncryptedParams = EncryptedResponsesStreamParams & {
  // The key to decrypt the submission responses.
  secretKey: string
  // Number of responses to expect to download.
  responsesCount: number
  // Used to determine if we should add MRF related columns to the CSV.
  isDownloadCsv: boolean
  isDownloadPdf: boolean
  visibleSubmissionIds?: string[]
  csvView?: CsvExportView
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
  // Builds the current download's zip, under Attachments v2
  const zipWorkerRef = useRef<CleanableZipWorkerApi>()

  const { data: adminForm } = useAdminForm()
  const { user } = useUser()
  const isWorkflowActionsOn = useFeatureIsOn(featureFlags.workflowActions)
  const keepV4AttachmentPrefix = useFeatureIsOn(
    featureFlags.keepV4AttachmentPrefix,
  )
  const isAttachmentsV2Enabled = useFeatureIsOn(featureFlags.attachmentsV2)

  useEffect(() => {
    return () => killWorkers(workers)
  }, [workers])

  useEffect(() => {
    const abortController = abortControllerRef.current
    return () => {
      abortController.abort()
      zipWorkerRef.current?.abort()
    }
  }, [])

  // Frees the disk space of zips from earlier downloads
  useEffect(() => {
    if (isAttachmentsV2Enabled) void clearStagedZips()
  }, [isAttachmentsV2Enabled])

  const downloadEncryptedResponses = useCallback(
    async ({
      responsesCount,
      downloadAttachments,
      isDownloadCsv,
      isDownloadPdf,
      secretKey,
      endDate,
      startDate,
      visibleSubmissionIds,
      csvView,
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

      const expectedResponsesCount =
        visibleSubmissionIds?.length ?? responsesCount

      // Under Attachments v2, everything ticked goes into one zip that is
      // saved once at the end. A CSV on its own stays a plain CSV.
      zipWorkerRef.current?.abort()
      const zipWorker =
        isAttachmentsV2Enabled && (downloadAttachments || isDownloadPdf)
          ? makeZipWorkerApiAndCleanup()
          : undefined
      zipWorkerRef.current = zipWorker
      let zipSinkMeta = {}
      if (zipWorker) {
        await clearStagedZips()
        const { sink, fallbackReason } = await zipWorker.workerApi.open()
        zipSinkMeta = { zipSink: sink, zipFallbackReason: fallbackReason }
      }

      const logMeta = {
        action: 'downloadEncryptedReponses',
        formId: adminForm._id,
        formTitle: adminForm.title,
        downloadAttachments,
        num_workers: numWorkers,
        expectedNumSubmissions: expectedResponsesCount,
        adminId: user?._id,
        ...zipSinkMeta,
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
            expectedResponsesCount,
            NUM_OF_METADATA_ROWS,
            csvView,
            { keepV4AttachmentPrefix },
          )
        : undefined

      // Serialises PDF generation and zip writes on the main thread
      let zipQueue: Promise<void> = Promise.resolve()
      // A download that errored never saves its zip
      let hasDownloadFailed = false
      const csvFilename = `${adminForm.title}-${adminForm._id}.csv`

      /**
       * Writes a response's attachments and PDF into the download zip, in its
       * response folder when attachments are downloaded. A response that
       * failed to decrypt gets no folder. One that decrypted keeps its folder
       * and PDF even if its attachments failed to download.
       */
      const addToZip = (
        { workerApi }: CleanableZipWorkerApi,
        decryptResult: DecryptedData,
      ): Promise<DecryptedData> => {
        zipQueue = zipQueue.then(async () => {
          if (freshAbortController.signal.aborted) return
          const { status, parsedSubmission, decryptedResponses, attachments } =
            decryptResult
          if (
            status.isDecryptionSuccessful &&
            parsedSubmission &&
            decryptedResponses
          ) {
            const folderPath = downloadAttachments
              ? `${getResponseFolderName({ refNo: parsedSubmission._id })}/`
              : ''
            // A response without attachments still gets its folder
            const entries: ZipEntry[] = folderPath ? [{ name: folderPath }] : []
            const files = attachments?.kind === 'files' ? attachments.files : []
            for (const { filename, content } of files) {
              entries.push({ name: `${folderPath}${filename}`, content })
            }
            if (isDownloadPdf) {
              // A PDF that fails is left out, so the other responses carry on
              try {
                const { pdfBlob, pdfTitle } = await generateResponsePdfBlob({
                  form: adminForm,
                  submission: {
                    refNo: parsedSubmission._id,
                    submissionTime: parsedSubmission.created,
                    responses: decryptedResponses,
                  },
                  keepV4AttachmentPrefix,
                })
                entries.push({
                  name: `${folderPath}${pdfTitle}`,
                  content: pdfBlob,
                })
              } catch (error) {
                datadogLogs.logger.error('Response PDF generation failed', {
                  meta: {
                    ...logMeta,
                    submissionId: parsedSubmission._id,
                    error:
                      error instanceof Error
                        ? { message: error.message, stack: error.stack }
                        : String(error),
                  },
                })
              }
            }
            // Move the file bytes to the zip worker instead of copying them
            await workerApi.add(
              transfer(entries, [
                ...new Set(files.map(({ content }) => content.buffer)),
              ]),
            )
          }
          if (isDownloadPdf) {
            onPdfGenerationProgress(
              (prevPdfGenerationProgress) => prevPdfGenerationProgress + 1,
            )
          }
        })
        // Keep only what the counts need, so the zip alone holds the files
        return zipQueue.then(() => ({ status: decryptResult.status }))
      }

      /** Finishes the zip and saves it. Resolves with its size for the logs. */
      const saveZip = async (
        { workerApi }: CleanableZipWorkerApi,
        csvBlob?: Blob,
      ) => {
        if (csvBlob) {
          await workerApi.add([
            {
              name: removeInvalidFileNameCharacters(csvFilename),
              content: csvBlob,
            },
          ])
        }
        const { zip, bytesWritten, fileCount } = await workerApi.finish()
        // Cancelling saves nothing
        if (freshAbortController.signal.aborted) return
        saveAs(zip, `${adminForm.title}-${adminForm._id}.zip`)
        return { zipBytes: bytesWritten, zipFileCount: fileCount }
      }

      const stream = await getEncryptedResponsesStream(
        adminForm._id,
        { downloadAttachments, endDate, startDate },
        freshAbortController,
      )
      const visibleSubmissionIdSet = visibleSubmissionIds
        ? new Set(visibleSubmissionIds)
        : undefined

      const bufferedRecords = visibleSubmissionIds
        ? new Map<string, DecryptedSubmissionData>()
        : undefined
      let csvSuccessCount = 0

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
          if (
            visibleSubmissionIdSet &&
            !visibleSubmissionIdSet.has(
              (JSON.parse(result.value) as { _id?: string })._id ?? '',
            )
          ) {
            return reader.read().then(read)
          }
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
                isWorkflowActionsOn,
                isAttachmentsV2Enabled,
                // Resolved here (on the main thread) so the worker doesn't
                // need to import env.ts (which references window).
                formsgSdkMode: env.formsgSdkMode,
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
                        if (bufferedRecords) {
                          bufferedRecords.set(
                            materializedCsvRecord.submissionData.submissionId,
                            materializedCsvRecord.submissionData,
                          )
                        } else {
                          csvGenerator.addRecord(
                            materializedCsvRecord.submissionData,
                          )
                        }
                        csvSuccessCount++
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
                if (zipWorker) {
                  return addToZip(zipWorker, decryptResult)
                }
                if (!downloadAttachments) {
                  return decryptResult
                }
                // Chain onto the queue so saves run one at a time
                saveQueue = saveQueue.then(async () => {
                  const { attachments, parsedSubmission } = decryptResult
                  if (attachments?.kind !== 'zip' || !parsedSubmission?._id) {
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
                    attachments.blob,
                    parsedSubmission._id,
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
            if (zipWorker) {
              await zipQueue
              return
            }
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
                      responses: decryptedResponses,
                    },
                    keepV4AttachmentPrefix,
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
            hasDownloadFailed = true
            killWorkers(workerPool)
            zipWorker?.abort()
            reject(err)
          })
          // Step 2: Generate the actual CSV file from the csv object.
          .finally(() => {
            if (freshAbortController.signal.aborted) {
              return
            }
            // Saves the zip, if any, before reporting the result
            const complete = (result: DownloadResult, csvBlob?: Blob) => {
              if (!zipWorker || hasDownloadFailed) return resolve(result)
              saveZip(zipWorker, csvBlob).then(
                (zipMeta) => {
                  zipWorker.cleanup()
                  // Downloads without a CSV log their success here too
                  if (zipMeta) {
                    datadogLogs.logger.info('Download response success', {
                      meta: {
                        ...logMeta,
                        ...zipMeta,
                        duration: performance.now() - downloadStartTime,
                      },
                    })
                  }
                  resolve(result)
                },
                (err) => {
                  datadogLogs.logger.info('Download response failure', {
                    meta: {
                      ...logMeta,
                      duration: performance.now() - downloadStartTime,
                      error: {
                        message: err.message,
                        name: err.name,
                        stack: err.stack,
                      },
                    },
                  })
                  zipWorker.abort()
                  reject(err)
                },
              )
            }
            const checkComplete = () => {
              if (!isDownloadCsv || !csvGenerator) {
                killWorkers(workerPool)
                complete({
                  expectedCount: expectedResponsesCount,
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
                expectedResponsesCount
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
                complete({
                  expectedCount: expectedResponsesCount,
                  successCount: csvGenerator.length(),
                  errorCount: csvOutcomeCounts.errorCount,
                  unverifiedCount: csvOutcomeCounts.unverifiedCount,
                })
              } else if (
                // All results have been decrypted
                csvSuccessCount +
                  csvOutcomeCounts.errorCount +
                  csvOutcomeCounts.unverifiedCount >=
                expectedResponsesCount
              ) {
                killWorkers(workerPool)
                if (bufferedRecords && visibleSubmissionIds) {
                  for (const submissionId of visibleSubmissionIds) {
                    const record = bufferedRecords.get(submissionId)
                    if (record) csvGenerator.addRecord(record)
                  }
                }
                // Generate first three rows of meta-data before download
                csvGenerator.addMetaDataFromSubmission(
                  csvOutcomeCounts.errorCount,
                  csvOutcomeCounts.unverifiedCount,
                )
                // The CSV goes into the zip when there is one
                const csvBlob = zipWorker
                  ? csvGenerator.getCsvBlob()
                  : undefined
                if (!zipWorker) csvGenerator.downloadCsv(csvFilename)

                const downloadEndTime = performance.now()
                const timeDifference = downloadEndTime - downloadStartTime

                // A zip logs its success once it is saved
                if (!zipWorker) {
                  datadogLogs.logger.info('Download response success', {
                    meta: {
                      ...logMeta,
                      duration: timeDifference,
                    },
                  })
                }

                trackDownloadResponseSuccess(
                  adminForm,
                  numWorkers,
                  NUM_OF_METADATA_ROWS,
                  timeDifference,
                )

                complete(
                  {
                    expectedCount: expectedResponsesCount,
                    successCount: csvGenerator.length(),
                    errorCount: csvOutcomeCounts.errorCount,
                    unverifiedCount: csvOutcomeCounts.unverifiedCount,
                  },
                  csvBlob,
                )
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
      isAttachmentsV2Enabled,
      keepV4AttachmentPrefix,
      isWorkflowActionsOn,
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
    zipWorkerRef.current?.abort()
    zipWorkerRef.current = undefined
  }, [handleBulkDownloadMutation, workers])

  return { handleBulkDownloadMutation, abortDecryption }
}

export default useDecryptionWorkers
