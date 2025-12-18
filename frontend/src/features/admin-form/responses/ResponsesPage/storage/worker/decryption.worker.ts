import { FormField } from '@opengovsg/formsg-sdk/dist/types'
import { expose } from 'comlink'
import { formatInTimeZone } from 'date-fns-tz'
import PQueue from 'p-queue'

import { SubmissionStreamDto, SubmissionType } from '~shared/types'

import formsgSdk from '~utils/formSdk'

import {
  AttachmentsDownloadMap,
  CsvRecordData,
  CsvRecordStatus,
  LineData,
  MaterializedCsvRecord,
} from '../types'
import { CsvRecord } from '../utils/CsvRecord.class'
import { downloadAndDecryptAttachmentsAsZip } from '../utils/downloadAndDecryptAttachment'
import {
  processDecryptedContent,
  processDecryptedContentV3,
} from '../utils/processDecryptedContent'

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

async function decryptSubmissionData({
  submissionData,
  secretKey,
}: {
  submissionData: SubmissionStreamDto
  secretKey: string
}): Promise<
  | {
      decryptedResponses: FormField[]
      mrfSubmissionSecretKey?: string
      isSubmissionDecryptionSuccessful: true
    }
  | {
      isSubmissionDecryptionSuccessful: false
    }
> {
  const { encryptedContent, verifiedContent, version, submissionType } =
    submissionData

  let decryptedResponses, mrfSubmissionSecretKey
  switch (submissionType) {
    case SubmissionType.Encrypt: {
      const decryptedObject = formsgSdk.crypto.decrypt(secretKey, {
        encryptedContent,
        verifiedContent,
        version,
      })
      if (!decryptedObject) {
        console.error('Invalid decryption for storage mode response')
        return {
          isSubmissionDecryptionSuccessful: false,
        }
      }
      decryptedResponses = processDecryptedContent(decryptedObject)
      break
    }
    case SubmissionType.Multirespondent: {
      const decryptedObject = formsgSdk.cryptoV3.decrypt(secretKey, {
        encryptedSubmissionSecretKey:
          submissionData.encryptedSubmissionSecretKey,
        encryptedContent,
        verifiedContent,
        version,
      })
      if (!decryptedObject) {
        console.error('Invalid decryption for multirespondent response')
        return {
          isSubmissionDecryptionSuccessful: false,
        }
      }
      mrfSubmissionSecretKey = decryptedObject.submissionSecretKey
      decryptedResponses = await processDecryptedContentV3(
        submissionData.form_fields,
        decryptedObject,
      )
      break
    }
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = submissionData
      console.error('Invalid submission type encountered.')
      return {
        isSubmissionDecryptionSuccessful: false,
      }
    }
  }
  return {
    decryptedResponses,
    mrfSubmissionSecretKey,
    isSubmissionDecryptionSuccessful: true,
  }
}

/**
 * Decrypts given data into a {@type CsvRecord} and posts the result back to the
 * main thread.
 * @param data The data to decrypt into a csvRecord.
 */
async function decryptIntoCsv(
  data: LineData,
  isFasterDownloadsEnabled: boolean = false,
): Promise<MaterializedCsvRecord> {
  // This needs to be dynamically imported due to sharing code between main app and worker code.
  // Fixes issue raised at https://stackoverflow.com/questions/66472945/referenceerror-refreshreg-is-not-defined
  // Something to do with babel-loader.
  const { line, secretKey, downloadAttachments, formId, hostOrigin } = data
  let csvRecord: CsvRecord
  const attachmentDownloadUrls: AttachmentsDownloadMap = new Map()
  let downloadBlob: Blob

  try {
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
      submission.submissionType === SubmissionType.Multirespondent
        ? {
            workflowStatus: submission.mrfMeta.workflowStatus,
            workflowCurrentStepNumber:
              submission.mrfMeta.workflowCurrentStepNumber,
            workflowNumTotalSteps: submission.mrfMeta.workflowNumTotalSteps,
            lastSubmittedAt: submission.mrfMeta.lastSubmittedAt,
            hasNextStepRecipientEmails:
              submission.mrfMeta.hasNextStepRecipientEmails,
          }
        : undefined,
    )

    const decryptSubmissionDataResult = await decryptSubmissionData({
      submissionData: submission,
      secretKey,
    })

    if (!decryptSubmissionDataResult.isSubmissionDecryptionSuccessful) {
      csvRecord.setStatus(CsvRecordStatus.Error, 'Decryption Error')
      csvRecord.materializeSubmissionData()
      return csvRecord as MaterializedCsvRecord
    }

    const { decryptedResponses, mrfSubmissionSecretKey } =
      decryptSubmissionDataResult

    if (
      // Short-circuit signature verification for multirespondent submission
      submission.submissionType === SubmissionType.Multirespondent ||
      verifySignature(decryptedResponses, submission.created)
    ) {
      csvRecord.setStatus(CsvRecordStatus.Ok, 'Success')
      csvRecord.setRecord(decryptedResponses)
    } else {
      csvRecord.setStatus(CsvRecordStatus.Unverified, 'Unverified')
    }

    if (downloadAttachments) {
      // Logic to determine which key to use to decrypt attachments.
      const attachmentDecryptionKey =
        // If no submission secret key present, it is a storage mode form. So, use form secret key.
        !mrfSubmissionSecretKey
          ? secretKey
          : // It's an mrf, but old version
            submission.submissionType === SubmissionType.Multirespondent &&
              !submission.mrfVersion
            ? secretKey
            : mrfSubmissionSecretKey

      let questionCount = 0
      const extraAttachments: {
        filename: string
        blob: Blob
      }[] = []
      decryptedResponses.forEach((field) => {
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
            extraAttachments,
          ),
        )
        csvRecord.setStatus(
          CsvRecordStatus.Ok,
          'Success (with Downloaded Attachment)',
        )
        if (isFasterDownloadsEnabled) {
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

export type DecryptionWorkerApi = typeof exports
