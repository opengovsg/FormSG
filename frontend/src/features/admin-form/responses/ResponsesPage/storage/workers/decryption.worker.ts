import { FormField as VerifiedFormField } from '@opengovsg/formsg-sdk/dist/types'
import { decode as decodeBase64 } from '@stablelib/base64'
import { expose } from 'comlink'
import { formatInTimeZone } from 'date-fns-tz'
import JSZip from 'jszip'
import { cloneDeep } from 'lodash'
import PQueue from 'p-queue'

import { StorageModeSubmissionStreamDto } from '~shared/types'

import formsgSdk from '~utils/formSdk'

import { processDecryptedContent } from '../utils/processDecryptedContent'

const queue = new PQueue({ concurrency: 1 })

enum CsvRecordStatus {
  Ok = 'OK',
  Unknown = 'UNKNOWN',
  Error = 'ERROR',
  AttachmentError = 'ATTACHMENT_ERROR',
  Unverified = 'UNVERIFIED',
}

type AttachmentsDownloadMap = Map<number, { url: string; filename?: string }>

/** @class CsvRecord represents the CSV data to be passed back, along with helper functions */
class CsvRecord {
  id: string
  created: string
  status: CsvRecordStatus
  downloadBlob?: Blob
  submissionData?: {
    created: string
    submissionId: string
    record: VerifiedFormField[]
  }

  private statusMessage: string
  private record: VerifiedFormField[]

  /**
   * Creates an instance of CsvRecord
   *
   * @constructor
   * @param id The ID of the submission
   * @param created The time of submission
   * @param status The status of the submission decryption/download process
   */
  constructor(id: string, created: string, status: CsvRecordStatus) {
    this.id = id
    this.created = created
    this.status = status

    /** @private */ this.statusMessage = status
    /** @private */ this.record = []
  }

  /**
   * Sets the decryption/download status
   *
   * @param status A status code indicating the decryption success to be consumed by submissions.client.factory.js
   * @param msg A human readable status message to be presented as part of the CSV download
   */
  setStatus(status: CsvRecordStatus, msg: string) {
    this.status = status
    this.statusMessage = msg
  }

  /**
   * Sets the ZIP attachment blob to be downloaded
   *
   * @param blob A blob containing a ZIP file of all the submission attachments downloaded
   */
  setDownloadBlob(blob: Blob) {
    this.downloadBlob = blob
  }

  /**
   * Sets the decrypted CSV record
   *
   * @param record The decrypted submission record
   */
  setRecord(record: VerifiedFormField[]) {
    this.record = record
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
    const downloadStatus: VerifiedFormField = {
      _id: '000000000000000000000000',
      fieldType: 'textfield',
      question: 'Download Status',
      answer: this.statusMessage,
    }
    const output = cloneDeep(this.record)
    output.unshift(downloadStatus)

    this.submissionData = {
      created: this.created,
      submissionId: this.id,
      record: output,
    }
  }
}

type LineData = {
  line: string
  secretKey: string
  downloadAttachments?: boolean
}

/**
 * Verifies that the signatures for every field that has a corresponding
 * signature are valid.
 * If any one of them is invalid, append NOT VERIFIED to that record.
 * The form is not retrieved to check if fields must be verifiable. Thus, if a
 * field is verifiable but does not have a signature, it is not verified here.
 * @param decryptedSubmission Array of JSON objects representing questions and answers
 * @param created Database timestamp of submission
 */
function verifySignature(
  decryptedSubmission: VerifiedFormField[],
  created: string,
) {
  const signatureFields = decryptedSubmission.filter((field) => field.signature)
  if (signatureFields.length === 0) return true
  const verified = signatureFields.map((field) => {
    const { signature: signatureString, _id: fieldId, answer } = field
    if (!signatureString || !answer) {
      return false
    }
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

async function downloadAndDecryptAttachment(url: string, secretKey: string) {
  const response = await fetch(url)
  const data = await response.json()
  data.encryptedFile.binary = decodeBase64(data.encryptedFile.binary)
  return await formsgSdk.crypto.decryptFile(secretKey, data.encryptedFile)
}

async function downloadAndDecryptAttachmentsAsZip(
  attachmentDownloadUrls: AttachmentsDownloadMap,
  secretKey: string,
) {
  const zip = new JSZip()
  const downloadPromises = []
  for (const [questionNum, metadata] of attachmentDownloadUrls) {
    downloadPromises.push(
      downloadAndDecryptAttachment(metadata.url, secretKey).then(
        (bytesArray) => {
          if (bytesArray) {
            zip.file(
              'Question ' + questionNum + ' - ' + metadata.filename,
              bytesArray,
            )
          }
        },
      ),
    )
  }
  await Promise.all(downloadPromises)
  return await zip.generateAsync({ type: 'blob' })
}

/**
 * Decrypts given data into a {@type CsvRecord} and posts the result back to the
 * main thread.
 * @param data The data to decrypt into a csvRecord.
 */
async function decryptIntoCsv(data: LineData): Promise<CsvRecord> {
  const { line, secretKey, downloadAttachments } = data

  let submission: StorageModeSubmissionStreamDto
  let csvRecord: CsvRecord
  const attachmentDownloadUrls: AttachmentsDownloadMap = new Map()
  let downloadBlob: Blob

  try {
    submission = JSON.parse(line)
    csvRecord = new CsvRecord(
      submission._id,
      submission.created,
      CsvRecordStatus.Unknown,
    )
    try {
      const decryptedObject = formsgSdk.crypto.decrypt(secretKey, {
        encryptedContent: submission.encryptedContent,
        verifiedContent: submission.verifiedContent,
        version: submission.version,
      })

      if (!decryptedObject) {
        throw new Error('Invalid decryption')
      }
      const decryptedSubmission = processDecryptedContent(decryptedObject)

      if (verifySignature(decryptedSubmission, submission.created)) {
        csvRecord.setStatus(CsvRecordStatus.Ok, 'Success')
        csvRecord.setRecord(decryptedSubmission)
      } else {
        csvRecord.setStatus(CsvRecordStatus.Unverified, 'Unverified')
      }

      if (downloadAttachments) {
        let questionCount = 0

        decryptedSubmission.forEach((field) => {
          // Populate question number
          if (field.fieldType !== 'section') {
            ++questionCount
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
          csvRecord.setStatus(
            CsvRecordStatus.Ok,
            'Success (with Downloaded Attachment)',
          )
          csvRecord.setDownloadBlob(downloadBlob)
        } catch (error) {
          csvRecord.setStatus(
            CsvRecordStatus.AttachmentError,
            'Attachment Download Error',
          )
        }
      }
    } catch (error) {
      csvRecord.setStatus(CsvRecordStatus.Error, 'Decryption Error')
    }
  } catch (err) {
    csvRecord = new CsvRecord(
      CsvRecordStatus.Error,
      formatInTimeZone(new Date(), 'Asia/Singapore', 'DD MMM YYYY hh:mm:ss A'),
      CsvRecordStatus.Error,
    )
    csvRecord.setStatus(CsvRecordStatus.Error, 'Error')
  }
  csvRecord.materializeSubmissionData()
  return csvRecord
}

const exports = {
  decryptIntoCsv,
}

export type DecryptionWorker = typeof exports

expose(exports)
