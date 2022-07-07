import { expose } from 'comlink'
import { formatInTimeZone } from 'date-fns-tz'
// Some webpack pipelines (Chromatic for ours) fails with the default export, but works with /dist export.
// Due to not recognizing export from the package's package.json.
// See https://github.com/sindresorhus/p-queue/issues/145
import PQueue from 'p-queue/dist'

import formsgSdk from '~utils/formSdk'

import {
  AttachmentsDownloadMap,
  CsvRecordData,
  CsvRecordStatus,
  LineData,
  MaterializedCsvRecord,
} from '../types'
import { CsvRecord } from '../utils/CsvRecord.class'

// Fixes issue raised at https://stackoverflow.com/questions/66472945/referenceerror-refreshreg-is-not-defined
// Something to do with babel-loader.
if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line
  ;(global as any).$RefreshReg$ = () => {}
  // eslint-disable-next-line
  ;(global as any).$RefreshSig$ = () => () => {}
}

const queue = new PQueue({ concurrency: 1 })

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
  decryptedSubmission: CsvRecordData[],
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

/**
 * Decrypts given data into a {@type CsvRecord} and posts the result back to the
 * main thread.
 * @param data The data to decrypt into a csvRecord.
 */
async function decryptIntoCsv(data: LineData): Promise<MaterializedCsvRecord> {
  // This needs to be dynamically imported due to sharing code between main app and worker code.
  // Fixes issue raised at https://stackoverflow.com/questions/66472945/referenceerror-refreshreg-is-not-defined
  // Something to do with babel-loader.

  // TODO: May be removed when we move to Webpack 5, where web workers are now first class citizens?
  const { processDecryptedContent } = await import(
    '../utils/processDecryptedContent'
  )
  const { downloadAndDecryptAttachmentsAsZip } = await import(
    '../utils/downloadAndDecryptAttachment'
  )

  const { StorageModeSubmissionStreamDto } = await import('~shared/types')

  const { line, secretKey, downloadAttachments } = data

  let csvRecord: CsvRecord
  const attachmentDownloadUrls: AttachmentsDownloadMap = new Map()
  let downloadBlob: Blob

  try {
    // Validate that the submission is of a valid shape.
    const submission = StorageModeSubmissionStreamDto.parse(JSON.parse(line))
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
    csvRecord.setStatus(CsvRecordStatus.Error, 'Submission decryption error')
  }
  csvRecord.materializeSubmissionData()
  return csvRecord as MaterializedCsvRecord
}

const exports = {
  decryptIntoCsv,
}

expose(exports)

export default {} as typeof Worker & { new (): Worker }
export type DecryptionWorkerApi = typeof exports
