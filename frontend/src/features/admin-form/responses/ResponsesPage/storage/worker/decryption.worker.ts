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
async function decryptIntoCsv(
  data: LineData,
  fasterDownloads: boolean,
): Promise<MaterializedCsvRecord> {
  // This needs to be dynamically imported due to sharing code between main app and worker code.
  // Fixes issue raised at https://stackoverflow.com/questions/66472945/referenceerror-refreshreg-is-not-defined
  // Something to do with babel-loader.

  // TODO: May be removed when we move to Webpack 5, where web workers are now first class citizens?
  const { processDecryptedContent, processDecryptedContentV3 } = await import(
    '../utils/processDecryptedContent'
  )
  const { downloadAndDecryptAttachmentsAsZip } = await import(
    '../utils/downloadAndDecryptAttachment'
  )

  const { SubmissionStreamDto, SubmissionType } = await import('~shared/types')

  const { line, secretKey, downloadAttachments, formId, hostOrigin } = data

  let csvRecord: CsvRecord
  const attachmentDownloadUrls: AttachmentsDownloadMap = new Map()
  let downloadBlob: Blob

  try {
    // Validate that the submission is of a valid shape.
    const submission = SubmissionStreamDto.parse(JSON.parse(line))
    csvRecord = new CsvRecord(
      submission._id,
      submission.created,
      CsvRecordStatus.Unknown,
      formId,
      hostOrigin,
      submission.submissionType === SubmissionType.Encrypt
        ? submission.payment
        : undefined,
    )
    try {
      let decryptedSubmission, submissionSecretKey
      switch (submission.submissionType) {
        case SubmissionType.Encrypt: {
          const decryptedObject = formsgSdk.crypto.decrypt(secretKey, {
            encryptedContent: submission.encryptedContent,
            verifiedContent: submission.verifiedContent,
            version: submission.version,
          })
          if (!decryptedObject) {
            throw new Error('Invalid decryption for storage mode response')
          }
          decryptedSubmission = processDecryptedContent(decryptedObject)
          break
        }
        case SubmissionType.Multirespondent: {
          const decryptedObject = formsgSdk.cryptoV3.decrypt(secretKey, {
            encryptedSubmissionSecretKey:
              submission.encryptedSubmissionSecretKey,
            encryptedContent: submission.encryptedContent,
            version: submission.version,
          })
          if (!decryptedObject) {
            throw new Error('Invalid decryption for multirespondent response')
          }
          submissionSecretKey = decryptedObject.submissionSecretKey
          decryptedSubmission = await processDecryptedContentV3(
            submission.form_fields,
            decryptedObject,
          )
          break
        }
        default: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const _: never = submission
          throw new Error('Invalid submission type encountered.')
        }
      }

      if (
        // Short-circuit signature verification for multirespondent submission
        submission.submissionType === SubmissionType.Multirespondent ||
        verifySignature(decryptedSubmission, submission.created)
      ) {
        csvRecord.setStatus(CsvRecordStatus.Ok, 'Success')
        csvRecord.setRecord(decryptedSubmission)
      } else {
        csvRecord.setStatus(CsvRecordStatus.Unverified, 'Unverified')
      }

      if (downloadAttachments) {
        // Logic to determine which key to use to decrypt attachments.
        const attachmentDecryptionKey =
          // If no submission secret key present, it is a storage mode form. So, use form secret key.
          !submissionSecretKey
            ? secretKey
            : // It's an mrf, but old version
              submission.submissionType === SubmissionType.Multirespondent &&
                !submission.mrfVersion
              ? secretKey
              : submissionSecretKey

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
              attachmentDecryptionKey,
            ),
          )
          csvRecord.setStatus(
            CsvRecordStatus.Ok,
            'Success (with Downloaded Attachment)',
          )
          if (fasterDownloads) {
            csvRecord.downloadBlobURL = URL.createObjectURL(downloadBlob)
          } else {
            csvRecord.setDownloadBlob(downloadBlob)
          }
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
      formatInTimeZone(new Date(), 'Asia/Singapore', 'dd MMM yyyy hh:mm:ss z'),
      CsvRecordStatus.Error,
      CsvRecordStatus.Error,
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
