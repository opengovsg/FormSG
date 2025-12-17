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
  DecryptedData,
  DownloadOptions,
  MaterializedCsvRecord,
  SubmissionDataForDecryption,
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      errorMessage: string
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
        const errorMessage = `Invalid decryption for storage mode response`
        console.error(errorMessage)
        return {
          errorMessage,
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
        const errorMessage = `Invalid decryption for multirespondent response`
        console.error(errorMessage)
        return {
          errorMessage,
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
      const errorMessage = `Invalid submission type encountered.`
      console.error(errorMessage)
      return {
        errorMessage,
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

type GetAttachmentDecryptionKeyParams = {
  submission: {
    submissionType: SubmissionType
    mrfVersion?: number
  }
  mrfSubmissionSecretKey?: string
  secretKey: string
}

function getAttachmentDecryptionKey({
  submission,
  mrfSubmissionSecretKey,
  secretKey,
}: GetAttachmentDecryptionKeyParams) {
  const { submissionType, mrfVersion } = submission
  if (!mrfSubmissionSecretKey) {
    // If no mrf submission secret key present, it is a storage mode form. So, use form secret key.
    return secretKey
  }
  const isOldMrfVersion =
    submissionType === SubmissionType.Multirespondent && !mrfVersion
  if (isOldMrfVersion) {
    return secretKey
  }
  return mrfSubmissionSecretKey
}

type _DownloadAndDecryptSubmissionAttachmentsParams = {
  attachmentDecryptionKey: string
  attachmentMetadata: Record<string, string>
  decryptedResponses: FormField[]
}
async function _downloadAndDecryptSubmissionAttachments({
  attachmentDecryptionKey,
  attachmentMetadata,
  decryptedResponses,
}: _DownloadAndDecryptSubmissionAttachmentsParams): Promise<
  | {
      downloadedAttachmentsBlob: Blob
      isDownloadSuccessful: boolean
    }
  | {
      errorMessage: string
      isDownloadSuccessful: false
    }
> {
  const attachmentDownloadUrls: AttachmentsDownloadMap = new Map()
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
    if (attachmentMetadata[field._id]) {
      attachmentDownloadUrls.set(questionCount, {
        url: attachmentMetadata[field._id],
        filename: field.answer,
      })
    }
  })
  try {
    const downloadedAttachmentsBlob = await queue.add(() =>
      downloadAndDecryptAttachmentsAsZip(
        attachmentDownloadUrls,
        attachmentDecryptionKey,
        extraAttachments,
      ),
    )
    return { downloadedAttachmentsBlob, isDownloadSuccessful: true }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return {
      errorMessage: 'Attachment download error',
      isDownloadSuccessful: false,
    }
  }
}

async function downloadAndDecryptSubmissionAttachments(
  downloadAndDecryptSubmissionAttachmentsParams: Pick<
    _DownloadAndDecryptSubmissionAttachmentsParams,
    'attachmentMetadata' | 'decryptedResponses'
  > &
    GetAttachmentDecryptionKeyParams,
) {
  const attachmentDecryptionKey = getAttachmentDecryptionKey(
    downloadAndDecryptSubmissionAttachmentsParams,
  )

  return await _downloadAndDecryptSubmissionAttachments({
    attachmentDecryptionKey,
    attachmentMetadata:
      downloadAndDecryptSubmissionAttachmentsParams.attachmentMetadata,
    decryptedResponses:
      downloadAndDecryptSubmissionAttachmentsParams.decryptedResponses,
  })
}

type LineData = {
  isDownloadAttachments: boolean
  formId: string
  hostOrigin: string
  isDownloadAttachmentsSuccessful: boolean
} & DecryptionResult

/**
 * Decrypts given data into a {@type CsvRecord} and posts the result back to the
 * main thread.
 * @param data The data to decrypt into a csvRecord.
 */
async function getMaterializedCsvRecord(
  lineData: LineData,
): Promise<MaterializedCsvRecord> {
  const {
    isDownloadAttachments,
    isParseSuccessful,
    isDecryptionSuccessful,
    formId,
    hostOrigin,
    isDownloadAttachmentsSuccessful,
  } = lineData

  if (!isParseSuccessful) {
    const ERROR_CSV_RECORD = new CsvRecord(
      CsvRecordStatus.Error,
      formatInTimeZone(new Date(), 'Asia/Singapore', 'dd MMM yyyy hh:mm:ss z'),
      CsvRecordStatus.Error,
      CsvRecordStatus.Error,
      CsvRecordStatus.Error,
    )
    ERROR_CSV_RECORD.setStatus(
      CsvRecordStatus.Error,
      'Error parsing submission',
    )
    ERROR_CSV_RECORD.materializeSubmissionData()
    return ERROR_CSV_RECORD as MaterializedCsvRecord
  }

  const { parsedSubmission } = lineData

  const {
    _id: submissionId,
    created: submissionCreated,
    submissionType,
  } = parsedSubmission

  const csvRecord = new CsvRecord(
    submissionId,
    submissionCreated,
    CsvRecordStatus.Unknown,
    formId,
    hostOrigin,
    submissionType === SubmissionType.Encrypt
      ? parsedSubmission.payment
      : undefined,
    submissionType === SubmissionType.Multirespondent
      ? {
          workflowStatus: parsedSubmission.mrfMeta.workflowStatus,
          workflowCurrentStepNumber:
            parsedSubmission.mrfMeta.workflowCurrentStepNumber,
          workflowNumTotalSteps: parsedSubmission.mrfMeta.workflowNumTotalSteps,
          lastSubmittedAt: parsedSubmission.mrfMeta.lastSubmittedAt,
          hasNextStepRecipientEmails:
            parsedSubmission.mrfMeta.hasNextStepRecipientEmails,
        }
      : undefined,
  )

  if (!isDecryptionSuccessful) {
    csvRecord.setStatus(CsvRecordStatus.Error, 'Decryption Error')
    csvRecord.materializeSubmissionData()
    return csvRecord as MaterializedCsvRecord
  }

  const { decryptedResponses } = lineData

  // Short-circuit signature verification for multirespondent submission
  if (
    submissionType === SubmissionType.Multirespondent ||
    verifySignature(decryptedResponses, submissionCreated)
  ) {
    csvRecord.setStatus(CsvRecordStatus.Ok, 'Success')
    csvRecord.setRecord(decryptedResponses)
  } else {
    csvRecord.setStatus(CsvRecordStatus.Unverified, 'Unverified')
  }

  if (isDownloadAttachments) {
    if (!isDownloadAttachmentsSuccessful) {
      csvRecord.setStatus(
        CsvRecordStatus.AttachmentError,
        'Attachment Download Error',
      )
      csvRecord.materializeSubmissionData()
      return csvRecord as MaterializedCsvRecord
    }
    csvRecord.setStatus(
      CsvRecordStatus.Ok,
      'Success (with Downloaded Attachment)',
    )
  }
  csvRecord.materializeSubmissionData()
  return csvRecord as MaterializedCsvRecord
}

type DecryptionResult =
  | {
      isParseSuccessful: false
      isDecryptionSuccessful: false
      errorMessage: string
    }
  | {
      isParseSuccessful: true
      parsedSubmission: SubmissionStreamDto
      isDecryptionSuccessful: false
      errorMessage: string
    }
  | {
      isParseSuccessful: true
      parsedSubmission: SubmissionStreamDto
      isDecryptionSuccessful: true
      decryptedResponses: FormField[]
      mrfSubmissionSecretKey?: string
    }

async function parseAndDecryptSubmissionData({
  submissionStreamDtoString,
  secretKey,
}: SubmissionDataForDecryption): Promise<DecryptionResult> {
  let submission: SubmissionStreamDto

  try {
    submission = SubmissionStreamDto.parse(
      JSON.parse(submissionStreamDtoString),
    )
  } catch (error) {
    const errorMessage = 'Error parsing submission'
    console.error(errorMessage, error)
    return {
      isParseSuccessful: false,
      isDecryptionSuccessful: false,
      errorMessage: errorMessage,
    }
  }

  const decryptSubmissionDataResult = await decryptSubmissionData({
    submissionData: submission,
    secretKey,
  })

  if (!decryptSubmissionDataResult.isSubmissionDecryptionSuccessful) {
    return {
      isParseSuccessful: true,
      parsedSubmission: submission,
      isDecryptionSuccessful: false,
      errorMessage: decryptSubmissionDataResult.errorMessage,
    }
  }

  return {
    isParseSuccessful: true,
    parsedSubmission: submission,
    isDecryptionSuccessful: true,
    decryptedResponses: decryptSubmissionDataResult.decryptedResponses,
    mrfSubmissionSecretKey: decryptSubmissionDataResult.mrfSubmissionSecretKey,
  }
}

type GetDecryptedDataParams = DownloadOptions & SubmissionDataForDecryption

async function getDecryptedData(
  getDecryptedDataParams: GetDecryptedDataParams,
): Promise<DecryptedData> {
  let materializedCsvRecord: MaterializedCsvRecord | undefined
  let attachmentDownloadBlob: Blob | undefined
  let isDownloadAndDecryptSubmissionAttachmentsSuccessful = false

  const { secretKey } = getDecryptedDataParams

  const decryptedSubmissionResult = await parseAndDecryptSubmissionData(
    getDecryptedDataParams,
  )

  const { isDownloadAttachments, isDownloadCsv } = getDecryptedDataParams
  const { isDecryptionSuccessful, isParseSuccessful } =
    decryptedSubmissionResult

  if (isDownloadAttachments) {
    if (isDecryptionSuccessful) {
      const { parsedSubmission, decryptedResponses, mrfSubmissionSecretKey } =
        decryptedSubmissionResult
      const { attachmentMetadata } = parsedSubmission
      const downloadAndDecryptSubmissionAttachmentsResult =
        await downloadAndDecryptSubmissionAttachments({
          attachmentMetadata,
          decryptedResponses,
          submission: parsedSubmission,
          secretKey,
          mrfSubmissionSecretKey,
        })
      const { isDownloadSuccessful } =
        downloadAndDecryptSubmissionAttachmentsResult
      isDownloadAndDecryptSubmissionAttachmentsSuccessful = isDownloadSuccessful

      if (isDownloadSuccessful) {
        attachmentDownloadBlob =
          downloadAndDecryptSubmissionAttachmentsResult.downloadedAttachmentsBlob
      }
    }
  }

  if (isDownloadCsv) {
    const { formId, hostOrigin } = getDecryptedDataParams
    materializedCsvRecord = await getMaterializedCsvRecord({
      isDownloadAttachments,
      formId,
      hostOrigin,
      isDownloadAttachmentsSuccessful:
        isDownloadAndDecryptSubmissionAttachmentsSuccessful,
      ...decryptedSubmissionResult,
    })
  }

  return {
    materializedCsvRecord,
    attachmentDownloadBlob,
    submissionId: isParseSuccessful
      ? decryptedSubmissionResult.parsedSubmission._id
      : undefined,
  }
}

const exports = {
  getDecryptedData,
}

expose(exports)

export type DecryptionWorkerApi = typeof exports
