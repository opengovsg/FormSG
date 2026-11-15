import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, UseMutationOptions } from 'react-query'
import { datadogLogs } from '@datadog/browser-logs'
import { useFeatureIsOn } from '@growthbook/growthbook-react'
import { transfer } from 'comlink'
import saveAs from 'file-saver'
import JSZip from 'jszip'

import { featureFlags } from 'formsg-shared/constants'
import { toSafeZipEntryName } from 'formsg-shared/utils/multi-attachment'

import { env } from '~/env'

import { waitForMs } from '~utils/waitForMs'

import { useAdminForm } from '~features/admin-form/common/queries'
import { useIsOneZipDownload } from '~features/admin-form/responses/hooks'
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
import {
  generateResponsePdfBlob,
  getPdfTitle,
} from '../../IndividualResponsePage/utils/generateResponsePdf'

import { CsvExportView } from './utils/csvExportView'
import { downloadResponseAttachment } from './utils/downloadCsv'
import { EncryptedResponseCsvGenerator } from './utils/EncryptedResponseCsvGenerator'
import {
  FAILED_RESPONSE_NAME,
  getTombstoneContent,
  getTombstoneName,
} from './utils/failedDownloads'
import { getResponseFolderName } from './utils/responseFolderName'
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
  FailedDownload,
} from './types'

const NUM_OF_METADATA_ROWS = 5

// We will download attachments in convoys of 5
// This is to prevent the script from downloading too many attachments at once
// which could cause it to block downloads.
const ATTACHMENT_DOWNLOAD_CONVOY_SIZE = 5
const ATTACHMENT_DOWNLOAD_CONVOY_MINIMUM_SEPARATION_TIME = 1000

const MAX_PENDING_ZIP_RESPONSES = 4

type ZipResponse = DecryptedData & { failedRefNo?: string }

const getStreamedRefNo = (submissionStreamDtoString: string): string => {
  try {
    return (
      (JSON.parse(submissionStreamDtoString) as { _id?: string })._id ??
      'unknown'
    )
  } catch {
    return 'unknown'
  }
}

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
  const zipWorkerRef = useRef<CleanableZipWorkerApi>()

  const { data: adminForm } = useAdminForm()
  const { user } = useUser()
  const isWorkflowActionsOn = useFeatureIsOn(featureFlags.workflowActions)
  const isOneZipDownload = useIsOneZipDownload()

  useEffect(() => {
    return () => killWorkers(workers)
  }, [workers])

  useEffect(() => {
    return () => {
      abortControllerRef.current.abort()
      zipWorkerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    void clearStagedZips()
  }, [])

  const downloadEncryptedResponses = useCallback(
    async (
      {
        responsesCount,
        downloadAttachments,
        isDownloadCsv,
        isDownloadPdf,
        secretKey,
        endDate,
        startDate,
        visibleSubmissionIds,
        csvView,
      }: DownloadEncryptedParams,
      freshAbortController: AbortController,
    ) => {
      if (!adminForm || !responsesCount) {
        return Promise.resolve({
          expectedCount: 0,
          successCount: 0,
          errorCount: 0,
        })
      }

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

      const isZipDownload =
        isOneZipDownload && (downloadAttachments || isDownloadPdf)
      zipWorkerRef.current?.abort()
      const zipWorker = isZipDownload ? makeZipWorkerApiAndCleanup() : undefined
      zipWorkerRef.current = zipWorker
      let zipSinkMeta = {}
      if (zipWorker) {
        try {
          await clearStagedZips()
          const { sink, fallbackReason } = await zipWorker.workerApi.open()
          zipSinkMeta = { zipSink: sink, zipFallbackReason: fallbackReason }
        } catch (error) {
          zipWorker.abort()
          throw error
        }
      }

      const logMeta = {
        action: 'downloadEncryptedReponses',
        formId: adminForm._id,
        formTitle: adminForm.title,
        downloadAttachments,
        isDownloadCsv,
        isDownloadPdf,
        num_workers: numWorkers,
        expectedNumSubmissions: expectedResponsesCount,
        adminId: user?._id,
        isOneZipDownload,
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

      const stopWorkers = () => {
        killWorkers(workerPool)
        zipWorker?.abort()
      }
      // A failed stream never reaches the cleanup after Promise.all below
      const stopWorkersOnError = <T>(promise: Promise<T>) =>
        promise.catch((error) => {
          stopWorkers()
          throw error
        })

      const csvGenerator = isDownloadCsv
        ? new EncryptedResponseCsvGenerator(
            expectedResponsesCount,
            NUM_OF_METADATA_ROWS,
            csvView,
          )
        : undefined

      let zipQueue: Promise<void> = Promise.resolve()
      let hasDownloadFailed = false
      let pendingZipCount = 0
      let onZipSlotFree: (() => void) | undefined
      const releaseZipSlotOnCancel = () => onZipSlotFree?.()
      freshAbortController.signal.addEventListener(
        'abort',
        releaseZipSlotOnCancel,
      )
      const csvFilename = `${adminForm.title}-${adminForm._id}.csv`

      const failedDownloads: FailedDownload[] = []

      const isResponseFailed = ({ status }: DecryptedData) =>
        !status.isDecryptionSuccessful ||
        (downloadAttachments &&
          !status.isDownloadAndDecryptSubmissionAttachmentsSuccessful)

      const addToZip = (
        { workerApi }: CleanableZipWorkerApi,
        decryptResult: ZipResponse,
      ): Promise<DecryptedData> => {
        zipQueue = zipQueue.then(async () => {
          if (freshAbortController.signal.aborted) return
          const {
            status,
            parsedSubmission,
            decryptedResponses,
            attachments,
            failedRefNo,
          } = decryptResult
          const getFolderPath = (refNo: string) =>
            `${getResponseFolderName({ refNo })}/`
          const entries: ZipEntry[] = []
          const addPlaceholder = (failure: FailedDownload, path: string) => {
            failedDownloads.push(failure)
            entries.push({ name: path, content: getTombstoneContent(failure) })
          }
          const files = attachments?.kind === 'files' ? attachments.files : []
          if (failedRefNo !== undefined) {
            addPlaceholder(
              {
                refNo: failedRefNo,
                name: FAILED_RESPONSE_NAME,
                reason: 'response',
              },
              getFolderPath(failedRefNo) +
                getTombstoneName(FAILED_RESPONSE_NAME),
            )
          } else if (
            status.isDecryptionSuccessful &&
            parsedSubmission &&
            decryptedResponses
          ) {
            const refNo = parsedSubmission._id
            const folderPath = getFolderPath(refNo)
            for (const { filename, content } of files) {
              entries.push({
                name: `${folderPath}${toSafeZipEntryName(filename)}`,
                content,
              })
            }
            if (attachments?.kind === 'files') {
              for (const { filename, reason } of attachments.failed) {
                addPlaceholder(
                  { refNo, name: filename, reason },
                  `${folderPath}${getTombstoneName(
                    toSafeZipEntryName(filename),
                  )}`,
                )
              }
            }
            if (isDownloadPdf) {
              try {
                const { pdfBlob, pdfTitle } = await generateResponsePdfBlob({
                  form: adminForm,
                  submission: {
                    refNo,
                    submissionTime: parsedSubmission.created,
                    responses: decryptedResponses,
                  },
                })
                entries.push({
                  name: `${folderPath}${pdfTitle}`,
                  content: pdfBlob,
                })
              } catch (error) {
                datadogLogs.logger.error('Response PDF generation failed', {
                  meta: {
                    ...logMeta,
                    submissionId: refNo,
                    error:
                      error instanceof Error
                        ? { message: error.message, stack: error.stack }
                        : String(error),
                  },
                })
                const pdfTitle = getPdfTitle({ submissionId: refNo })
                addPlaceholder(
                  { refNo, name: pdfTitle, reason: 'pdf' },
                  `${folderPath}${getTombstoneName(pdfTitle)}`,
                )
              }
            }
            entries.push({ name: folderPath })
          }
          if (entries.length) {
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
        return zipQueue.then(() => ({ status: decryptResult.status }))
      }

      const toFailedZipResponse = (
        error: unknown,
        submissionStreamDtoString: string,
      ): ZipResponse => {
        const refNo = getStreamedRefNo(submissionStreamDtoString)
        datadogLogs.logger.error('Response download failed', {
          meta: {
            ...logMeta,
            submissionId: refNo,
            error:
              error instanceof Error
                ? { message: error.message, stack: error.stack }
                : String(error),
          },
        })
        return {
          status: {
            isDecryptionSuccessful: false,
            isDownloadAndDecryptSubmissionAttachmentsSuccessful: false,
          },
          failedRefNo: refNo,
        }
      }

      const saveZip = async (
        { workerApi }: CleanableZipWorkerApi,
        csvBlob?: Blob,
      ) => {
        if (csvBlob) {
          await workerApi.add([
            {
              name: toSafeZipEntryName(csvFilename),
              content: csvBlob,
            },
          ])
        }
        const { zip, bytesWritten, fileCount } = await workerApi.finish()
        if (freshAbortController.signal.aborted) return
        saveAs(zip, `${adminForm.title}-${adminForm._id}.zip`)
        return { zipBytes: bytesWritten, zipFileCount: fileCount }
      }

      const stream = await stopWorkersOnError(
        getEncryptedResponsesStream(
          adminForm._id,
          { downloadAttachments, endDate, startDate },
          freshAbortController,
        ),
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

      const readStream = reader.read().then(
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
                isOneZipDownload,
                // Resolved here (on the main thread) so the worker doesn't
                // need to import env.ts (which references window).
                formsgSdkMode: env.formsgSdkMode,
              })
              .catch((error) => {
                if (!zipWorker) throw error
                if (isDownloadCsv) csvOutcomeCounts.errorCount++
                return toFailedZipResponse(error, result.value)
              })
              // Step 2: Update the Csv record status based on the decryption result.
              .then(async (decryptResult: ZipResponse) => {
                // Count general decryption successes and failures
                if (isResponseFailed(decryptResult)) {
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
                  const failedRefNo =
                    decryptResult.failedRefNo ??
                    (isResponseFailed(decryptResult)
                      ? (decryptResult.parsedSubmission?._id ??
                        getStreamedRefNo(result.value))
                      : undefined)
                  return addToZip(zipWorker, {
                    ...decryptResult,
                    failedRefNo,
                  })
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
              .catch((error) => {
                hasDownloadFailed = true
                throw error
              })
              // Step 4: Update the progress bar only once the attachments for the decrypted submission have been downloaded (if needed).
              .finally(() => {
                onDecryptionProgress(
                  (prevDecryptionProgress) => prevDecryptionProgress + 1,
                )
                if (zipWorker) {
                  pendingZipCount -= 1
                  onZipSlotFree?.()
                  onZipSlotFree = undefined
                }
              }),
          )
          currentSubmissionIndex += 1 // used to assign the next submission to the next worker
          if (zipWorker) {
            pendingZipCount += 1
            if (pendingZipCount >= MAX_PENDING_ZIP_RESPONSES) {
              await new Promise<void>((resolve) => (onZipSlotFree = resolve))
            }
            if (hasDownloadFailed) return reader.cancel()
          }
          return reader.read().then(read)
        }),
      )
      await stopWorkersOnError(readStream).finally(() =>
        freshAbortController.signal.removeEventListener(
          'abort',
          releaseZipSlotOnCancel,
        ),
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
            if (zipWorker) hasDownloadFailed = true
            stopWorkers()
            reject(err)
          })
          // Step 2: Generate the actual CSV file from the csv object.
          .finally(() => {
            if (freshAbortController.signal.aborted || hasDownloadFailed) {
              return
            }
            const complete = (result: DownloadResult, csvBlob?: Blob) => {
              if (!zipWorker) return resolve(result)
              saveZip(zipWorker, csvBlob).then(
                (zipMeta) => {
                  zipWorker.cleanup()
                  if (!zipMeta) return
                  datadogLogs.logger.info('Download response success', {
                    meta: {
                      ...logMeta,
                      ...zipMeta,
                      failedDownloadCount: failedDownloads.length,
                      duration: performance.now() - downloadStartTime,
                    },
                  })
                  const zipResult = { ...result, zipBytes: zipMeta.zipBytes }
                  resolve(
                    failedDownloads.length
                      ? { ...zipResult, failedDownloads }
                      : zipResult,
                  )
                },
                (err) => {
                  zipWorker.abort()
                  if (freshAbortController.signal.aborted) return
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
                const csvBlob = zipWorker
                  ? csvGenerator.getCsvBlob()
                  : undefined
                if (!zipWorker) csvGenerator.downloadCsv(csvFilename)

                const downloadEndTime = performance.now()
                const timeDifference = downloadEndTime - downloadStartTime

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
      isOneZipDownload,
      isWorkflowActionsOn,
      onDecryptionProgress,
      onPdfGenerationProgress,
      user?._id,
      workers,
    ],
  )

  const handleBulkDownloadMutation = useMutation(
    (params: DownloadEncryptedParams) => {
      abortControllerRef.current.abort()
      const abortController = new AbortController()
      abortControllerRef.current = abortController
      return downloadEncryptedResponses(params, abortController).catch(
        (error) => {
          // A stopped download stays unsettled so leftover errors can't replace the stopped screen
          if (abortController.signal.aborted)
            return new Promise<never>(() => {})
          throw error
        },
      )
    },
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
