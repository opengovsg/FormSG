'use strict'

const CsvMHGenerator = require('../helpers/CsvMergedHeadersGenerator')
const DecryptionWorker = require('../helpers/decryption.worker.js')
const { fixParamsToUrl, triggerFileDownload } = require('../helpers/util')
const { ndjsonStream } = require('../helpers/ndjsonStream')
const fetchStream = require('fetch-readablestream')
const { decode: decodeBase64 } = require('@stablelib/base64')
const JSZip = require('jszip')
const AdminSubmissionsService = require('../../../services/AdminSubmissionsService')

const NUM_OF_METADATA_ROWS = 5

angular
  .module('forms')
  .factory('Submissions', [
    '$q',
    '$http',
    '$timeout',
    '$window',
    'GTag',
    'FormSgSdk',
    SubmissionsFactory,
  ])

let downloadAbortController
let workerPool = []

// Helper function to kill an array of EncryptionWorkers
function killWorkers(pool) {
  pool.forEach((worker) => worker.terminate())
}

function SubmissionsFactory($q, $http, $timeout, $window, GTag, FormSgSdk) {
  const ADMIN_FORMS_PREFIX = '/api/v3/admin/forms'

  const generateDownloadUrl = (params, downloadAttachments) => {
    // NOTE: The ? is appended behind to ensure that the query parameters in url are constructed correctly
    let resUrl = `${fixParamsToUrl(
      params,
      `${ADMIN_FORMS_PREFIX}/:formId/submissions/download?`,
    )}`
    if (params.startDate && params.endDate) {
      resUrl += `startDate=${params.startDate}&endDate=${params.endDate}&`
    }
    if (downloadAttachments) {
      resUrl += `downloadAttachments=true&`
    }
    return resUrl
  }

  const submissionService = {
    /**
     * Triggers a download of a set of attachments as a zip file when given attachment metadata and a secret key
     * @param {Map} attachmentDownloadUrls Map of question number to individual attachment metadata (object with url and filename properties)
     * @param {String} secretKey An instance of EncryptionKey for decrypting the attachment
     * @returns {Promise} A Promise containing the contents of the ZIP file as a blob
     */
    downloadAndDecryptAttachmentsAsZip: function (
      attachmentDownloadUrls,
      secretKey,
    ) {
      var zip = new JSZip()
      let downloadPromises = []
      for (const [questionNum, metadata] of attachmentDownloadUrls) {
        downloadPromises.push(
          this.downloadAndDecryptAttachment(metadata.url, secretKey).then(
            (bytesArray) => {
              zip.file(
                'Question ' + questionNum + ' - ' + metadata.filename,
                bytesArray,
              )
            },
          ),
        )
      }
      return Promise.all(downloadPromises).then(() => {
        return zip.generateAsync({ type: 'blob' })
      })
    },
    /**
     * Triggers a download of a single attachment when given an S3 presigned url and a secretKey
     * @param {String} url URL pointing to the location of the encrypted attachment
     * @param {String} secretKey An instance of EncryptionKey for decrypting the attachment
     * @returns {Promise} A Promise containing the contents of the file as a Blob
     */
    downloadAndDecryptAttachment: function (url, secretKey) {
      return $http.get(url).then((response) => {
        let data = response.data
        data.encryptedFile.binary = decodeBase64(data.encryptedFile.binary)
        return FormSgSdk.crypto.decryptFile(secretKey, data.encryptedFile)
      })
    },
    /**
     * Cancels an existing on-going download
     */
    cancelDownloadEncryptedResponses: function () {
      downloadAbortController.abort()
      killWorkers(workerPool)
      workerPool = []
    },
    /**
     * Triggers a download of file responses when called
     * @param {String} params.formId ID of the form
     * @param {String} params.formTitle The title of the form
     * @param  {String} params.startDate? The specific start date to filter for file responses in YYYY-MM-DD
     * @param  {String} params.endDate? The specific end date to filter for file responses in YYYY-MM-DD
     * @param {Boolean} downloadAttachments Whether to download attachments as ZIP files in addition to responses as CSV
     * @param {String} secretKey An instance of EncryptionKey for decrypting the submission
     * @returns {Promise} Empty Promise object for chaining
     */
    downloadEncryptedResponses: function (
      params,
      downloadAttachments,
      secretKey,
    ) {
      // Clear current worker pool.
      workerPool = []
      // Creates a new AbortController for every request
      downloadAbortController = new AbortController()
      const { formId, startDate, endDate } = params

      return $q
        .when(
          AdminSubmissionsService.countFormSubmissions({
            formId,
            dates: { startDate, endDate },
          }),
        )
        .then((expectedNumResponses) => {
          return new Promise(function (resolve, reject) {
            // No responses expected
            if (expectedNumResponses === 0) {
              return resolve({
                expectedCount: 0,
                successCount: 0,
                errorCount: 0,
              })
            }

            let resUrl = generateDownloadUrl(params, downloadAttachments)
            let experimentalCsvGenerator = new CsvMHGenerator(
              expectedNumResponses,
              NUM_OF_METADATA_ROWS,
            )
            let attachmentErrorCount = 0
            let errorCount = 0
            let unverifiedCount = 0
            let receivedRecordCount = 0

            // Create a pool of decryption workers
            // If we are downloading attachments, we restrict the number of threads
            // to one to limit resource usage on the client's browser.
            const numWorkers = downloadAttachments
              ? 1
              : $window.navigator.hardwareConcurrency || 4

            // Trigger analytics here before starting decryption worker.
            GTag.downloadResponseStart(params, expectedNumResponses, numWorkers)

            for (let i = 0; i < numWorkers; i++) {
              workerPool.push(new DecryptionWorker())
            }

            // Configure each worker
            workerPool.forEach((worker) => {
              // When worker returns a decrypted message
              worker.onmessage = (event) => {
                const { data } = event
                const { csvRecord } = data

                if (csvRecord.status === 'ATTACHMENT_ERROR') {
                  attachmentErrorCount++
                  errorCount++
                } else if (csvRecord.status === 'ERROR') {
                  errorCount++
                } else if (csvRecord.status === 'UNVERIFIED') {
                  unverifiedCount++
                }

                if (csvRecord.submissionData) {
                  // accumulate dataset if it exists, since we may have status columns available
                  experimentalCsvGenerator.addRecord(csvRecord.submissionData)
                }

                if (downloadAttachments && csvRecord.downloadBlob) {
                  triggerFileDownload(
                    csvRecord.downloadBlob,
                    'RefNo ' + csvRecord.id + '.zip',
                  )
                }
              }
              // When worker fails to decrypt a message
              worker.onerror = (error) => {
                errorCount++
                console.error('EncryptionWorker Error', error)
              }

              // Initiate all workers with formsgSdkMode so they can spin up
              // formsg sdk with the correct keys.
              worker.postMessage({
                init: true,
                formsgSdkMode: $window.formsgSdkMode,
              })
            })

            let downloadStartTime
            fetchStream(resUrl, { signal: downloadAbortController.signal })
              .then((response) => ndjsonStream(response.body))
              .then((stream) => {
                downloadStartTime = performance.now()
                const reader = stream.getReader()
                let read
                reader
                  .read()
                  .then(
                    (read = (result) => {
                      if (result.done) return
                      try {
                        // round-robin scheduling
                        workerPool[
                          receivedRecordCount % numWorkers
                        ].postMessage({
                          line: result.value,
                          secretKey,
                          downloadAttachments,
                        })
                        receivedRecordCount++
                      } catch (error) {
                        console.error('Error parsing JSON', error)
                      }

                      reader.read().then(read) // recurse through the stream
                    }),
                  )
                  .catch((err) => {
                    if (!downloadStartTime) {
                      // No start time, means did not even start http request.
                      GTag.downloadNetworkFailure(params, err)
                    } else {
                      const downloadFailedTime = performance.now()
                      const timeDifference =
                        downloadFailedTime - downloadStartTime
                      // Google analytics tracking for failure.
                      GTag.downloadResponseFailure(
                        params,
                        numWorkers,
                        expectedNumResponses,
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
                    function checkComplete() {
                      // If all the records could not be decrypted
                      if (
                        errorCount + unverifiedCount ===
                        expectedNumResponses
                      ) {
                        const failureEndTime = performance.now()
                        const timeDifference =
                          failureEndTime - downloadStartTime
                        // Google analytics tracking for partial decrypt
                        // failure.
                        GTag.partialDecryptionFailure(
                          params,
                          numWorkers,
                          experimentalCsvGenerator.length(),
                          errorCount,
                          attachmentErrorCount,
                          timeDifference,
                        )
                        killWorkers(workerPool)
                        reject(
                          new Error(
                            JSON.stringify({
                              expectedCount: expectedNumResponses,
                              successCount: experimentalCsvGenerator.length(),
                              errorCount,
                              unverifiedCount,
                            }),
                          ),
                        )
                      } else if (
                        // All results have been decrypted
                        experimentalCsvGenerator.length() +
                          errorCount +
                          unverifiedCount >=
                        expectedNumResponses
                      ) {
                        killWorkers(workerPool)
                        // Generate first three rows of meta-data before download
                        experimentalCsvGenerator.addMetaDataFromSubmission(
                          errorCount,
                          unverifiedCount,
                        )
                        experimentalCsvGenerator.downloadCsv(
                          `${params.formTitle}-${params.formId}.csv`,
                        )

                        const downloadEndTime = performance.now()
                        const timeDifference =
                          downloadEndTime - downloadStartTime

                        // Google analytics tracking for success.
                        GTag.downloadResponseSuccess(
                          params,
                          numWorkers,
                          experimentalCsvGenerator.length(),
                          timeDifference,
                        )

                        resolve({
                          expectedCount: expectedNumResponses,
                          successCount: experimentalCsvGenerator.length(),
                          errorCount,
                          unverifiedCount,
                        })
                        // Kill class instance and reclaim the memory.
                        experimentalCsvGenerator = null
                      } else {
                        $timeout(checkComplete, 100)
                      }
                    }

                    checkComplete()
                  })
              })
          })
        })
    },
  }
  return submissionService
}
