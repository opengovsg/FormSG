import { FormField } from '@opengovsg/formsg-sdk/dist/types'
import { Remote } from 'comlink'
import { SetRequired } from 'type-fest'

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

export type DecryptedSubmissionData = {
  created: string
  submissionId: string
  record: CsvRecordData[]
}

export type MaterializedCsvRecord = SetRequired<CsvRecord, 'submissionData'>

export type LineData = {
  line: string
  secretKey: string
  downloadAttachments?: boolean
  formId: string
  hostOrigin: string
}

export type CleanableDecryptionWorkerApi = {
  workerApi: Remote<DecryptionWorkerApi>
  cleanup: () => void
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
