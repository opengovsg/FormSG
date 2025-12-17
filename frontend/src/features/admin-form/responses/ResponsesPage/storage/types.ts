import { FormField } from '@opengovsg/formsg-sdk/dist/types'
import { Remote } from 'comlink'
import { SetRequired } from 'type-fest'

import { SubmissionMrfMetadata } from '~shared/types'

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
}

/**
 * Decrypted formatted data returned by the decryption worker.
 */
export type DecryptedData = {
  materializedCsvRecord?: MaterializedCsvRecord
  attachmentDownloadBlob?: Blob
  submissionId?: string
}

/** Download result after downloading storage mode responses */
export type DownloadResult = {
  expectedCount: number
  successCount: number
  errorCount: number
  unverifiedCount?: number
}

export type CanceledResult = {
  isCanceled: true
}
