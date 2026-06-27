import { FormWebhook } from 'formsg-shared/types'
import { okAsync, ResultAsync } from 'neverthrow'

import { SubmissionHistoryUploadError } from './submission-history.errors'
import { SubmissionHistoryStore } from './submission-history.store'
import {
  SUBMISSION_HISTORY_ENVELOPE_VERSION,
  SubmissionHistorySnapshot,
} from './submission-history.types'

/** `mrfVersion === 2` denotes V4 (object-provenance) encryption. */
const MRF_V4_VERSION = 2

/**
 * Single source of truth for whether a step should be snapshotted to
 * `submission_history`. The (future) send-side and retry-message-type
 * selection MUST derive from this same predicate, so a snapshot is never
 * expected where none was written.
 *
 * Criteria: unified-mode V4 encryption AND the form has a webhook URL with
 * retries enabled.
 */
export const shouldPersistMrfSnapshot = (
  webhook: FormWebhook | undefined,
  mrfVersion: number | undefined,
): boolean =>
  mrfVersion === MRF_V4_VERSION && !!webhook?.url && !!webhook?.isRetryEnabled

const normalizeAttachmentMetadata = (
  attachmentMetadata?: Map<string, string> | Record<string, string>,
): Record<string, string> | undefined => {
  if (!attachmentMetadata) return undefined
  const obj =
    attachmentMetadata instanceof Map
      ? Object.fromEntries(attachmentMetadata)
      : attachmentMetadata
  return Object.keys(obj).length > 0 ? obj : undefined
}

interface PersistMrfSnapshotParams {
  formId: string
  submissionId: string
  submissionIndex: number
  workflowStep: number
  webhook: FormWebhook | undefined
  mrfVersion: number | undefined
  encryptedContent: string
  /** Submission secret key wrapped to the form public key (never plaintext). */
  encryptedSubmissionSecretKey: string
  verifiedContent?: string
  attachmentMetadata?: Map<string, string> | Record<string, string>
}

/**
 * Produce and persist the per-step `v4` snapshot when the form's policy
 * requires it, otherwise no-op.
 *
 * On the submission write path this runs S3-first (before the Mongo commit):
 * an `err` aborts the submission, while a snapshot whose submission later
 * fails to commit is a benign orphan (the live row remains the source of
 * truth and a resubmit overwrites it).
 *
 * @returns `ok(true)` if a snapshot was written, `ok(false)` if not required.
 */
export const persistMrfSnapshotIfRequired = ({
  formId,
  submissionId,
  submissionIndex,
  workflowStep,
  webhook,
  mrfVersion,
  encryptedContent,
  encryptedSubmissionSecretKey,
  verifiedContent,
  attachmentMetadata,
}: PersistMrfSnapshotParams): ResultAsync<
  boolean,
  SubmissionHistoryUploadError
> => {
  if (!shouldPersistMrfSnapshot(webhook, mrfVersion)) {
    return okAsync(false)
  }

  const snapshot: SubmissionHistorySnapshot = {
    _v: SUBMISSION_HISTORY_ENVELOPE_VERSION,
    formId,
    submissionId,
    submissionIndex,
    workflowStep,
    encryptedContent,
    encryptedSubmissionSecretKey,
    verifiedContent,
    attachmentMetadata: normalizeAttachmentMetadata(attachmentMetadata),
    createdAt: new Date().toISOString(),
  }

  return SubmissionHistoryStore.saveSnapshot(snapshot, 'v4').map(() => true)
}
