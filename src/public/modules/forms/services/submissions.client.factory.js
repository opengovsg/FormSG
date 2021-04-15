'use strict'

const HttpStatus = require('http-status-codes')
const CsvMHGenerator = require('../helpers/CsvMergedHeadersGenerator')
const DecryptionWorker = require('../helpers/decryption.worker.js')
const { fixParamsToUrl, triggerFileDownload } = require('../helpers/util')
const ndjsonStream = require('../helpers/ndjsonStream')
const fetchStream = require('fetch-readablestream')
const { forOwn } = require('lodash')
const { decode: decodeBase64 } = require('@stablelib/base64')
const JSZip = require('jszip')

const NUM_OF_METADATA_ROWS = 5

angular
  .module('forms')
  .factory('Submissions', [
    '$q',
    '$http',
    '$timeout',
    '$window',
    'GTag',
    'responseModeEnum',
    'FormSgSdk',
    SubmissionsFactory,
  ])

let downloadAbortController
let workerPool = []

// Helper function to kill an array of EncryptionWorkers
function killWorkers(pool) {
  pool.forEach((worker) => worker.terminate())
}

function SubmissionsFactory(
  $q,
  $http,
  $timeout,
  $window,
  GTag,
  responseModeEnum,
  FormSgSdk,
) {
  const publicSubmitUrl = '/api/v3/forms/:formId/submissions/:responseMode'

  const previewSubmitUrl = '/v2/submissions/:responseMode/preview/:formId'

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

  /**
   * Creates form data and submits as multi-part
   * @param {String} resUrl
   * @param {Object} body
   */
  const emailSubmissionOverMultiPart = (resUrl, body) => {
    let deferred = $q.defer()
    // Create form data from body
    let fd = new FormData()
    const formBody = {
      isPreview: body.isPreview,
      responses: body.responses,
    }
    // append body of post request to body key of formData
    fd.append('body', JSON.stringify(formBody))
    // append each file of post request to formData
    if (body.attachments) {
      forOwn(body.attachments, (attachment, fieldId) => {
        if (attachment) {
          fd.append(attachment.name, attachment, fieldId)
        }
      })
    }
    // initialise new XMLHttpRequest
    let xhr = new XMLHttpRequest()
    xhr.open('POST', resUrl)
    // Send Data
    xhr.send(fd)
    // On Response
    xhr.onreadystatechange = function () {
      // 4 DONE  The operation is complete.
      const OPERATION_DONE = 4
      if (xhr.readyState === OPERATION_DONE) {
        // waterfall is successful
        if (xhr.status === HttpStatus.OK) {
          deferred.resolve('Submission has finished.')
        } else {
          let response = {}
          try {
            response = JSON.parse(xhr.responseText)
            // eslint-disable-next-line no-empty
          } catch (e) {}
          deferred.reject(
            `${
              response.message ||
              "Please refresh and try again. If this doesn't work, try switching devices or networks."
            }`,
          )
        }
      }
    }
    return deferred.promise
  }

  /**
   * Creates request body and submits using $http service
   * @param {String} resUrl
   * @param {Object} body
   */
  const encryptSubmissionOverHttp = (resUrl, body) => {
    let deferred = $q.defer()
    $http
      .post(resUrl, {
        isPreview: body.isPreview,
        responses: body.responses,
        encryptedContent: body.encryptedContent,
        attachments: body.attachments,
        version: body.version,
      })
      .then(
        function () {
          deferred.resolve('Submission has finished.')
        },
        function (error) {
          deferred.reject(
            `${
              error.message ||
              "Please refresh and try again. If this doesn't work, try switching devices or networks."
            }`,
          )
        },
      )
    return deferred.promise
  }

  const submissionService = {
    post: function (params, body) {
      const resUrl = fixParamsToUrl(
        params,
        (body.isPreview ? previewSubmitUrl : publicSubmitUrl) +
          '?captchaResponse=' +
          body.captchaResponse,
        true,
      )
      if (params.responseMode === responseModeEnum.ENCRYPT) {
        return encryptSubmissionOverHttp(resUrl, body)
      } else {
        return emailSubmissionOverMultiPart(resUrl, body)
      }
    },
    count: function (params) {
      const deferred = $q.defer()
      let resUrl = fixParamsToUrl(
        params,
        `${ADMIN_FORMS_PREFIX}/:formId/submissions/count`,
      )
      if (params.startDate && params.endDate) {
        resUrl += `?startDate=${params.startDate}&endDate=${params.endDate}`
      }

      $http.get(resUrl).then(
        function (response) {
          deferred.resolve(response.data)
        },
        function () {
          deferred.reject('Submissions count cannot be obtained.')
        },
      )
      return deferred.promise
    },
    getMetadata: function (params) {
      const deferred = $q.defer()
      let resUrl = `${fixParamsToUrl(
        params,
        `${ADMIN_FORMS_PREFIX}/:formId/submissions/metadata`,
      )}?page=${params.page}`

      if (params.filterBySubmissionRefId) {
        resUrl += `&submissionId=${params.filterBySubmissionRefId}`
      }

      $http.get(resUrl).then(
        function (response) {
          deferred.resolve(response.data)
        },
        function () {
          deferred.reject('Submissions: Responses cannot be obtained.')
        },
      )
      return deferred.promise
    },
    getEncryptedResponse: function (params) {
      const deferred = $q.defer()
      const resUrl = `${fixParamsToUrl(
        params,
        `${ADMIN_FORMS_PREFIX}/:formId/submissions/:submissionId`,
      )}`

      $http.get(resUrl).then(
        function (response) {
          deferred.resolve(response.data)
        },
        function () {
          deferred.reject('Submissions: Specific response cannot be obtained.')
        },
      )
      return deferred.promise
    },
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

      return this.count(params).then((expectedNumResponses) => {
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
                      workerPool[receivedRecordCount % numWorkers].postMessage({
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
                    if (errorCount + unverifiedCount === expectedNumResponses) {
                      const failureEndTime = performance.now()
                      const timeDifference = failureEndTime - downloadStartTime
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
                      const timeDifference = downloadEndTime - downloadStartTime

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
