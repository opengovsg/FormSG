const moment = require('moment-timezone')
const formsgPackage = require('@opengovsg/formsg-sdk')
const processDecryptedContent = require('../helpers/process-decrypted-content')
const {
  TRANSACTION_EXPIRE_AFTER_SECONDS,
} = require('../../../../shared/util/verification')
const JSZip = require('jszip')
const { decode: decodeBase64 } = require('@stablelib/base64')
const { default: PQueue } = require('p-queue')
require('core-js/stable/promise')
require('regenerator-runtime/runtime')

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

/** @typedef {{
 *    created: string,
 *    id: string,
 *    status?: string
 *    submissionData?: Object
 * }}
 * CsvRecord */

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
  /** @type {CsvRecord} */
  let csvRecord
  let attachmentDownloadUrls = new Map()
  let downloadBlob

  try {
    submission = JSON.parse(line)

    csvRecord = {
      created: submission.created,
      id: submission._id,
    }
    try {
      const decryptedSubmission = processDecryptedContent(
        formsgSdk.crypto.decrypt(secretKey, {
          encryptedContent: submission.encryptedContent,
          verifiedContent: submission.verifiedContent,
        }),
      )

      if (verifySignature(decryptedSubmission, submission.created)) {
        csvRecord.status = 'OK'
        csvRecord.submissionData = {
          created: submission.created,
          submissionId: submission._id,
          record: decryptedSubmission,
        }
      } else {
        csvRecord.status = 'UNVERIFIED'
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
        } catch (error) {
          csvRecord.status = 'ATTACHMENT_ERROR'
        }
      }
    } catch (error) {
      csvRecord.status = 'ERROR'
    }
  } catch (err) {
    csvRecord = {
      created: moment().tz('Asia/Singapore').format('DD MMM YYYY hh:mm:ss A'),
      id: 'ERROR',
      status: 'ERROR',
    }
  }
  self.postMessage({ csvRecord, downloadBlob })
}

self.addEventListener('message', ({ data }) => {
  if (data.init) {
    return initFormSg(data.formsgSdkMode)
  } else {
    return decryptIntoCsv(data)
  }
})
