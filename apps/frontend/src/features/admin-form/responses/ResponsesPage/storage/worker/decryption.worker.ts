import formsgPackage from '@opengovsg/formsg-sdk'
import { FormField, PackageMode } from '@opengovsg/formsg-sdk/dist/types'
import { expose } from 'comlink'
import { formatInTimeZone } from 'date-fns-tz'
import PQueue from 'p-queue'

import { SubmissionStreamDto, SubmissionType } from 'formsg-shared/types'
import { TRANSACTION_EXPIRE_AFTER_SECONDS } from 'formsg-shared/utils/verification'

import {
  AttachmentsDownloadMap,
  CsvRecordData,
  CsvRecordStatus,
  DecryptedData,
  DecryptionCtx,
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

// WorkerCtx extends the shared DecryptionCtx; add worker-specific deps here if needed.
type WorkerCtx = DecryptionCtx

let cachedFormsgSdk: DecryptionCtx['formsgSdk'] | null = null
let cachedMode: string | null = null

interface WorkerCtxOptions {
  formsgSdkMode: string
}

function createWorkerCtx({ formsgSdkMode }: WorkerCtxOptions): WorkerCtx {
  if (!cachedFormsgSdk || cachedMode !== formsgSdkMode) {
    cachedFormsgSdk = formsgPackage({
      mode: formsgSdkMode as PackageMode,
      verificationOptions: {
        transactionExpiry: TRANSACTION_EXPIRE_AFTER_SECONDS,
      },
    })
    cachedMode = formsgSdkMode
  }
  return { formsgSdk: cachedFormsgSdk }
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
  ctx: WorkerCtx,
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
      return ctx.formsgSdk.verification.authenticate({
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

async function decryptSubmissionData(
  ctx: WorkerCtx,
  {
    submissionData,
    secretKey,
  }: {
    submissionData: SubmissionStreamDto
    secretKey: string
  },
): Promise<
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
      const decryptedObject = ctx.formsgSdk.crypto.decrypt(secretKey, {
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
      const decryptedObject = ctx.formsgSdk.cryptoV3.decrypt(secretKey, {
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
async function _downloadAndDecryptSubmissionAttachments(
  ctx: WorkerCtx,
  {
    attachmentDecryptionKey,
    attachmentMetadata,
    decryptedResponses,
  }: _DownloadAndDecryptSubmissionAttachmentsParams,
): Promise<
  | {
      downloadedAttachmentsBlob: Blob
      isDownloadSuccessful: boolean
    }
  | {
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
        ctx,
        attachmentDownloadUrls,
        attachmentDecryptionKey,
        extraAttachments,
      ),
    )
    return { downloadedAttachmentsBlob, isDownloadSuccessful: true }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return {
      isDownloadSuccessful: false,
    }
  }
}

async function downloadAndDecryptSubmissionAttachments(
  ctx: WorkerCtx,
  downloadAndDecryptSubmissionAttachmentsParams: Pick<
    _DownloadAndDecryptSubmissionAttachmentsParams,
    'attachmentMetadata' | 'decryptedResponses'
  > &
    GetAttachmentDecryptionKeyParams,
) {
  const attachmentDecryptionKey = getAttachmentDecryptionKey(
    downloadAndDecryptSubmissionAttachmentsParams,
  )

  return await _downloadAndDecryptSubmissionAttachments(ctx, {
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
  ctx: WorkerCtx,
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

  const csvRecord = new CsvRecord(
    parsedSubmission._id,
    parsedSubmission.created,
    CsvRecordStatus.Unknown,
    formId,
    hostOrigin,
    parsedSubmission.submissionType === SubmissionType.Encrypt
      ? parsedSubmission.payment
      : undefined,
    parsedSubmission.submissionType === SubmissionType.Multirespondent
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
    parsedSubmission.submissionType === SubmissionType.Multirespondent ||
    verifySignature(ctx, decryptedResponses, parsedSubmission.created)
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
    }
  | {
      isParseSuccessful: true
      parsedSubmission: SubmissionStreamDto
      isDecryptionSuccessful: false
    }
  | {
      isParseSuccessful: true
      parsedSubmission: SubmissionStreamDto
      isDecryptionSuccessful: true
      decryptedResponses: FormField[]
      mrfSubmissionSecretKey?: string
    }

async function parseAndDecryptSubmissionData(
  ctx: WorkerCtx,
  { submissionStreamDtoString, secretKey }: SubmissionDataForDecryption,
): Promise<DecryptionResult> {
  let submission: SubmissionStreamDto

  try {
    submission = SubmissionStreamDto.parse(
      JSON.parse(submissionStreamDtoString),
    )
  } catch (error) {
    console.error('Error parsing submission', error)
    return {
      isParseSuccessful: false,
      isDecryptionSuccessful: false,
    }
  }

  const decryptSubmissionDataResult = await decryptSubmissionData(ctx, {
    submissionData: submission,
    secretKey,
  })

  if (!decryptSubmissionDataResult.isSubmissionDecryptionSuccessful) {
    return {
      isParseSuccessful: true,
      parsedSubmission: submission,
      isDecryptionSuccessful: false,
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

type GetDecryptedDataParams = Pick<
  DownloadOptions,
  'isDownloadAttachments' | 'isDownloadCsv'
> &
  SubmissionDataForDecryption

async function getDecryptedData(
  getDecryptedDataParams: GetDecryptedDataParams,
): Promise<DecryptedData> {
  const ctx = createWorkerCtx(getDecryptedDataParams)

  let materializedCsvRecord: MaterializedCsvRecord | undefined
  let attachmentDownloadBlob: Blob | undefined
  let isDownloadAndDecryptSubmissionAttachmentsSuccessful = false

  const { secretKey } = getDecryptedDataParams

  const decryptedSubmissionResult = await parseAndDecryptSubmissionData(
    ctx,
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
        await downloadAndDecryptSubmissionAttachments(ctx, {
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
    materializedCsvRecord = await getMaterializedCsvRecord(ctx, {
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
    parsedSubmission: isParseSuccessful
      ? decryptedSubmissionResult.parsedSubmission
      : undefined,
    decryptedResponses: isDecryptionSuccessful
      ? decryptedSubmissionResult.decryptedResponses
      : undefined,
    status: {
      isDecryptionSuccessful,
      isDownloadAndDecryptSubmissionAttachmentsSuccessful,
    },
  }
}

const exports = {
  getDecryptedData,
}

expose(exports)

export type DecryptionWorkerApi = typeof exports
