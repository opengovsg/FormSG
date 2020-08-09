'use strict'

const HttpStatus = require('http-status-codes')
const CsvMHGenerator = require('../helpers/CsvMergedHeadersGenerator')
const DecryptionWorker = require('../helpers/decryption.worker.js')
const { fixParamsToUrl } = require('../helpers/util')
const ndjsonStream = require('../helpers/ndjsonStream')
const fetchStream = require('fetch-readablestream')
const { forOwn } = require('lodash')

const NUM_OF_METADATA_ROWS = 4

angular
  .module('forms')
  .factory('Submissions', [
    '$q',
    '$http',
    '$timeout',
    '$window',
    'GTag',
    'responseModeEnum',
    SubmissionsFactory,
  ])

function SubmissionsFactory(
  $q,
  $http,
  $timeout,
  $window,
  GTag,
  responseModeEnum,
) {
  const submitAdminUrl = '/:formId/adminform/submissions'
  const publicSubmitUrl = '/v2/submissions/:responseMode/:formId'
  const previewSubmitUrl = '/v2/submissions/:responseMode/preview/:formId'

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
          deferred.reject(`${response.message || 'An unknown error occurred'}`)
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
          deferred.reject(`${error.message || 'An unknown error occurred'}`)
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
      let resUrl = fixParamsToUrl(params, submitAdminUrl) + '/count'
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
      let resUrl = `${fixParamsToUrl(params, submitAdminUrl)}/metadata?page=${
        params.page
      }`

      if (params.filterBySubmissionRefId) {
        resUrl += `&filterBySubmissionRefId=${params.filterBySubmissionRefId}`
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
      const resUrl = `${fixParamsToUrl(params, submitAdminUrl)}?submissionId=${
        params.submissionId
      }`

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
     * Triggers a download of file responses when called
     * @param {String} params.formId ID of the form
     * @param {String} params.formTitle The title of the form
     * @param  {String} params.startDate? The specific start date to filter for file responses in YYYY-MM-DD
     * @param  {String} params.endDate? The specific end date to filter for file responses in YYYY-MM-DD
     * @param {String} secretKey An instance of EncryptionKey for decrypting the submission
     * @returns {Promise} Empty Promise object for chaining
     */
    downloadEncryptedResponses: function (params, secretKey) {
      // Helper function to kill an array of EncryptionWorkers
      const killWorkers = (workerPool) => {
        workerPool.forEach((worker) => worker.terminate())
      }

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

          let resUrl = `${fixParamsToUrl(params, submitAdminUrl)}/download`
          if (params.startDate && params.endDate) {
            resUrl += `?startDate=${params.startDate}&endDate=${params.endDate}`
          }

          let experimentalCsvGenerator = new CsvMHGenerator(
            expectedNumResponses,
            NUM_OF_METADATA_ROWS,
          )
          let errorCount = 0
          let unverifiedCount = 0
          let receivedRecordCount = 0

          // Create a pool of decryption workers
          const numWorkers = $window.navigator.hardwareConcurrency || 4

          // Trigger analytics here before starting decryption worker.
          GTag.downloadResponseStart(params, expectedNumResponses, numWorkers)

          const workerPool = []
          for (let i = 0; i < numWorkers; i++) {
            workerPool.push(new DecryptionWorker())
          }

          // Configure each worker
          workerPool.forEach((worker) => {
            // When worker returns a decrypted message
            worker.onmessage = (event) => {
              const { data } = event
              const { csvRecord } = data

              if (csvRecord.status === 'ERROR') {
                errorCount++
              } else if (csvRecord.status === 'UNVERIFIED') {
                unverifiedCount++
              } else {
                // accumulate dataset
                experimentalCsvGenerator.addRecord(csvRecord.submissionData)
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

          fetchStream(resUrl)
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
                    'Failed to download CSV, is there a network issue?',
                    err,
                  )
                  workerPool.forEach((worker) => worker.terminate())
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
