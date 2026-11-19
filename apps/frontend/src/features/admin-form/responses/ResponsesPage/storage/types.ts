import type formsgPackage from '@opengovsg/formsg-sdk'
import { FormField } from '@opengovsg/formsg-sdk/dist/types'
import { Remote } from 'comlink'
import { SetRequired } from 'type-fest'

import { SubmissionMrfMetadata, SubmissionStreamDto } from 'formsg-shared/types'

import { CsvRecord } from './utils/CsvRecord.class'
import { DecryptionWorkerApi } from './worker/decryption.worker'

export enum CsvRecordStatus {
  Ok = 'OK',
  Unknown = 'UNKNOWN',
  Error = 'ERROR',
  AttachmentError = 'ATTACHMENT_ERROR',
  Unverified = 'UNVERIFIED',
}

export type AttachmentsDownloadMap = Map<
  number,
  { url: string; filename?: string }
>

export type DecryptedAttachmentFile = {
  filename: string
  content: Uint8Array<ArrayBuffer>
}

export type FailedAttachmentFile = {
  filename: string
  reason: 'download' | 'decrypt'
}

export type DecryptedAttachments =
  | { kind: 'zip'; blob: Blob }
  | {
      kind: 'files'
      files: DecryptedAttachmentFile[]
      failed: FailedAttachmentFile[]
    }

export type FailedDownload = {
  refNo: string
  name: string
  reason: FailedAttachmentFile['reason'] | 'pdf' | 'response'
}

export type DecryptionCtx = {
  formsgSdk: ReturnType<typeof formsgPackage>
}

export type CsvRecordData = FormField

export type MaterializedCsvRecord = SetRequired<CsvRecord, 'submissionData'>

export type DecryptedSubmissionData = {
  created: string
  submissionId: string
  mrfMeta?: SubmissionMrfMetadata
  record: CsvRecordData[]
}

export interface SubmissionDataForDecryption {
  submissionStreamDtoString: string
  secretKey: string
  formId: string
  hostOrigin: string
  formsgSdkMode: string
  useV4?: boolean
  isWorkflowActionsOn?: boolean
  isOneZipDownload: boolean
}

export type CleanableDecryptionWorkerApi = {
  workerApi: Remote<DecryptionWorkerApi>
  cleanup: () => void
}

/**
 * Options for bulk download.
 */
export interface DownloadOptions {
  isDownloadAttachments: boolean
  isDownloadCsv: boolean
  isDownloadPdf: boolean
}

export const isCsvOnlyDownload = ({
  isDownloadCsv,
  isDownloadAttachments,
  isDownloadPdf,
}: DownloadOptions): boolean =>
  isDownloadCsv && !isDownloadAttachments && !isDownloadPdf

/**
 * Decrypted formatted data returned by the decryption worker.
 */
export type DecryptedData = {
  status: {
    isDecryptionSuccessful: boolean
    isDownloadAndDecryptSubmissionAttachmentsSuccessful: boolean
  }
  materializedCsvRecord?: MaterializedCsvRecord
  attachments?: DecryptedAttachments
  parsedSubmission?: SubmissionStreamDto
  decryptedResponses?: FormField[]
}

/** Download result after downloading storage mode responses */
export type DownloadResult = {
  expectedCount: number
  successCount: number
  errorCount: number
  unverifiedCount?: number
  failedDownloads?: FailedDownload[]
  zipBytes?: number
}

export type CanceledResult = {
  isCanceled: true
}
