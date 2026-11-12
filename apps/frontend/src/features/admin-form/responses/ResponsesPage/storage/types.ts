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

/** A decrypted attachment, named `Question N - <filename>`. */
export type DecryptedAttachmentFile = {
  filename: string
  content: Uint8Array<ArrayBuffer>
}

/** An attachment that didn't make it into the download zip. */
export type FailedAttachmentFile = {
  filename: string
  // Still failing to download after its retries, or downloaded but undecryptable
  reason: 'download' | 'decrypt'
}

/**
 * A response's decrypted attachments: one zip per response, or for the one
 * zip download the files themselves, and those that failed.
 */
export type DecryptedAttachments =
  | { kind: 'zip'; blob: Blob }
  | {
      kind: 'files'
      files: DecryptedAttachmentFile[]
      failed: FailedAttachmentFile[]
    }

/**
 * Something left out of the one zip download, marked by a placeholder file in
 * its place and listed in the toast.
 */
export type FailedDownload = {
  refNo: string
  // An attachment's `Question N - <filename>`, the response's PDF title, or
  // `Response` when the whole response failed
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
  // Return attachments as files for the one zip download
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
  // What the one zip download left out, if anything
  failedDownloads?: FailedDownload[]
}

export type CanceledResult = {
  isCanceled: true
}
