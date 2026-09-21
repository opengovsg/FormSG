// Kept in src because backend spec files are excluded from the build typecheck.
import { SubmissionSnapshotV1 } from './submission-snapshot.schema'
import { StorageShapedWebhookData } from './v1-payload'
import { reconstructV1WebhookData } from './webhook-reconstruction'

const STORAGE_SHAPED: StorageShapedWebhookData = {
  formId: 'form-1',
  submissionId: 'sub-1',
  encryptedContent: 'form-key-encrypted',
  verifiedContent: undefined,
  version: 2.1,
  created: new Date(0),
  attachmentDownloadUrls: {},
  paymentContent: {},
}

const _withWorkflowContent: StorageShapedWebhookData = {
  ...STORAGE_SHAPED,
  // @ts-expect-error `workflowContent` is not a key of the storage-mode shape
  workflowContent: { workflow: [], workflowStep: 0, submittedSteps: [] },
}

const _withSubmissionSecretKey: StorageShapedWebhookData = {
  ...STORAGE_SHAPED,
  // @ts-expect-error `encryptedSubmissionSecretKey` is not a key of the shape
  encryptedSubmissionSecretKey: 'wrapped-read-key',
}

const _v1WithoutSnapshot = () =>
  reconstructV1WebhookData({
    liveData: {
      ...STORAGE_SHAPED,
      verifiedContent: undefined,
    },
    // @ts-expect-error a V1 reconstruction cannot be asked for without a snapshot
    snapshot: undefined,
  })

const _v1SnapshotWithKey: SubmissionSnapshotV1 = {
  _v: 1,
  contentFormat: 'v1',
  formId: 'form-1',
  submissionId: 'sub-1',
  submissionIndex: 0,
  workflowStep: 0,
  encryptedContent: 'form-key-encrypted',
  createdAt: '2026-07-22T00:00:00.000Z',
  // @ts-expect-error the V1 snapshot shape stores no wrapped read key
  encryptedSubmissionSecretKey: 'wrapped-read-key',
}

export const V1_PAYLOAD_TYPE_ASSERTIONS = [
  _withWorkflowContent,
  _withSubmissionSecretKey,
  _v1WithoutSnapshot,
  _v1SnapshotWithKey,
] as const
