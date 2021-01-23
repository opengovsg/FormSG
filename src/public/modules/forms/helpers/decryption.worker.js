// Roundabout way to detect IE, since WebWorkers do not run in the
// same context as the main thread.
if (!window.Promise) {
  require('core-js/stable')
  require('regenerator-runtime/runtime')
}

const formsgPackage = require('@opengovsg/formsg-sdk')
const { cloneDeep } = require('lodash')
const { decode: decodeBase64 } = require('@stablelib/base64')
const JSZip = require('jszip')
const moment = require('moment-timezone')
const { default: PQueue } = require('p-queue')

const processDecryptedContent = require('../helpers/process-decrypted-content')
const {
  TRANSACTION_EXPIRE_AFTER_SECONDS,
} = require('../../../../shared/util/verification')

let formsgSdk
const queue = new PQueue({ concurrency: 1 })

function initFormSg(formsgSdkMode) {
  if (!formsgSdkMode) {
    throw new Error('An init message must contain a `formsgSdkMode` parameter')
  }
  formsgSdk = formsgPackage({
    mode: formsgSdkMode,
    verificationOptions: {
      transactionExpiry: TRANSACTION_EXPIRE_AFTER_SECONDS,
    },
  })
}

function downloadAndDecryptAttachment(url, secretKey) {
  return fetch(url)
    .then((response) => response.json())
    .then((data) => {
      data.encryptedFile.binary = decodeBase64(data.encryptedFile.binary)
      return formsgSdk.crypto.decryptFile(secretKey, data.encryptedFile)
    })
}

function downloadAndDecryptAttachmentsAsZip(attachmentDownloadUrls, secretKey) {
  var zip = new JSZip()
  let downloadPromises = []
  for (const [questionNum, metadata] of attachmentDownloadUrls) {
    downloadPromises.push(
      downloadAndDecryptAttachment(metadata.url, secretKey).then(
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
}

/**
 * Verifies that the signatures for every field that has a corresponding signature are valid.
 * If any one of them is invalid, append NOT VERIFIED to that record.
 * We do not retrieve the form to check if fields must be verifiable. Thus if a field is verifiable but does not have a signature,
 * we would not verify it here.
 * @param {Array} decryptedSubmission Array of JSON objects representing questions and answers
 * @param {String} created Database timestamp of submission
 * @returns {Boolean}
 */
function verifySignature(decryptedSubmission, created) {
  let signatureFields = decryptedSubmission.filter((field) => field.signature)
  if (signatureFields.length === 0) return true
  const verified = signatureFields.map((field) => {
    const { signature: signatureString, _id: fieldId, answer } = field
    try {
      return formsgSdk.verification.authenticate({
        signatureString,
        submissionCreatedAt: Date.parse(created),
        fieldId,
        answer,
      })
    } catch (error) {
      return false
    }
  })
  return verified.every((v) => v)
}

/** @class CsvRecord represents the CSV data to be passed back, along with helper functions */
class CsvRecord {
  /**
   * Creates an instance of CsvRecord
   *
   * @constructor
   * @param {string} id The ID of the submission
   * @param {Moment} created The time of submission
   * @param {string} status The status of the submission decryption/download process
   */
  constructor(id, created, status) {
    this.id = id
    this.created = created
    this.status = status

    /** @private */ this._statusMessage = status
    /** @private */ this._record = []
  }

  /**
   * Sets the decryption/download status
   *
   * @param {string} status A status code indicating the decryption success to be consumed by submissions.client.factory.js
   * @param {string} msg A human readable status message to be presented as part of the CSV download
   */
  setStatus(status, msg) {
    this.status = status
    this._statusMessage = msg
  }

  /**
   * Sets the ZIP attachment blob to be downloaded
   *
   * @param {Blob} blob A blob containing a ZIP file of all the submission attachments downloaded
   */
  setDownloadBlob(blob) {
    this.downloadBlob = blob
  }

  /**
   * Sets the decrypted CSV record
   *
   * @param {Array} record The decrypted submission record
   */
  setRecord(record) {
    this._record = record
  }

  /**
   * Materializes the `submissionData` field
   *
   * This function should be called before the CsvRecord is passed back using `postMessage`.
   * Since `postMessage` does not support code being passed back to the main thread, the
   * `CsvRecord` received will only contain simple fields (e.g. `created`, `status`, etc...).
   *
   * This function creates a `submissionData` field in the object containing the final
   * answers to be added to the CSV file. This `submissionData` field will be passed back
   * using `postMessage` since it does not contain code.
   */
  materializeSubmissionData() {
    let downloadStatus = {
      _id: '000000000000000000000000',
      fieldType: 'textfield',
      question: 'Download Status',
      answer: this._statusMessage,
      questionNumber: 1000000,
    }
    let output = cloneDeep(this._record)
    output.unshift(downloadStatus)

    this.submissionData = {
      created: this.created,
      submissionId: this.id,
      record: output,
    }
  }
}

/**
 * Decrypts given data into a {@link CsvRecord} and posts the result back to the
 * main thread.
 * @param {{line: string, secretKey: string}} data The data to decrypt into a csvRecord.
 */
async function decryptIntoCsv(data) {
  if (!formsgSdk) {
    throw new Error(
      'An init message containing the node environment must first be passed in before any other action',
    )
  }

  const { line, secretKey, downloadAttachments } = data

  let submission
  let csvRecord
  let attachmentDownloadUrls = new Map()
  let downloadBlob

  try {
    submission = JSON.parse(line)
    csvRecord = new CsvRecord(submission._id, submission.created, 'UNKNOWN')
    try {
      const decryptedSubmission = processDecryptedContent(
        formsgSdk.crypto.decrypt(secretKey, {
          encryptedContent: submission.encryptedContent,
          verifiedContent: submission.verifiedContent,
        }),
      )

      if (verifySignature(decryptedSubmission, submission.created)) {
        csvRecord.setStatus('OK', 'Success')
        csvRecord.setRecord(decryptedSubmission)
      } else {
        csvRecord.setStatus('UNVERIFIED', 'Unverified')
      }
      if (downloadAttachments) {
        let questionCount = 0

        decryptedSubmission.forEach((field) => {
          // Populate question number
          if (field.fieldType !== 'section') {
            field.questionNumber = ++questionCount
          }
          // Populate S3 presigned URL for attachments
          if (submission.attachmentMetadata[field._id]) {
            attachmentDownloadUrls.set(questionCount, {
              url: submission.attachmentMetadata[field._id],
              filename: field.answer,
            })
          }
        })

        try {
          downloadBlob = await queue.add(() =>
            downloadAndDecryptAttachmentsAsZip(
              attachmentDownloadUrls,
              secretKey,
            ),
          )
          csvRecord.setStatus('OK', 'Success (with Downloaded Attachment)')
          csvRecord.setDownloadBlob(downloadBlob)
        } catch (error) {
          csvRecord.setStatus('ATTACHMENT_ERROR', 'Attachment Download Error')
        }
      }
    } catch (error) {
      csvRecord.setStatus('ERROR', 'Decryption Error')
    }
  } catch (err) {
    csvRecord = new CsvRecord(
      'ERROR',
      moment().tz('Asia/Singapore').format('DD MMM YYYY hh:mm:ss A'),
      'ERROR',
    )
    csvRecord.setStatus('ERROR', 'Error')
  }
  csvRecord.materializeSubmissionData()
  self.postMessage({ csvRecord })
}

self.addEventListener('message', ({ data }) => {
  if (data.init) {
    return initFormSg(data.formsgSdkMode)
  } else {
    return decryptIntoCsv(data)
  }
})
