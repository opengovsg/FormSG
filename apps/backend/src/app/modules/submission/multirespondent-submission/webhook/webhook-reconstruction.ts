import { WorkflowWebhookEventObject } from 'src/app/modules/webhook/webhook.types'
import { WebhookData } from 'src/types/submission'

import { SnapshotDataIntegrityError } from './submission-snapshot.errors'
import { SubmissionSnapshot } from './submission-snapshot.schema'
import {
  contentShapeToSubmissionVersion,
  WebhookPayloadPolicy,
} from './webhook-payload-policy'

/**
 * M3 — webhook view reconstruction (PURE, I/O-free).
 *
 * Given the LIVE-row webhook view, the frozen per-step snapshot, and the
 * send-time payload policy, produce the exact WebhookData that goes on the
 * wire. No S3 reads, no mongoose, no config — every input is pre-fetched.
 *
 * The source-of-each-field split is the S4 contract:
 *  - identity / definition / payment / attachments come from the LIVE row,
 *  - encrypted content, verified content, version, and the
 *    encryptedSubmissionSecretKey come FROZEN from the snapshot,
 *  - submittedSteps is reconstructed as the prefix up to this step.
 */
export const reconstructMrfWebhookData = (input: {
  liveData: WebhookData
  snapshot?: SubmissionSnapshot
  submissionIndex?: number
  policy: WebhookPayloadPolicy
}): WebhookData => {
  const { liveData, snapshot, submissionIndex, policy } = input

  // Legacy / plumber-today / no-snapshot path: the live-row payload IS the
  // wire payload. Return it unchanged (and never mutate it).
  if (submissionIndex === undefined) {
    return liveData
  }

  // Snapshot path. The snapshot MUST exist — fail loud rather than silently
  // falling back to the live row, which could leak later-step content.
  if (!snapshot) {
    // eslint-disable-next-line typesafe/no-throw-sync-func
    throw new SnapshotDataIntegrityError(
      'Snapshot missing on the snapshot reconstruction path',
      { submissionId: liveData.submissionId, submissionIndex },
    )
  }

  // Reconstruct workflowContent: keep the workflow DEFINITION from the live
  // row, override workflowStep from the snapshot, and rebuild submittedSteps
  // as the prefix up to and including this step. Handle the case where the
  // live workflowContent is a plain object (no submittedSteps array).
  const liveWorkflow = (liveData.workflowContent ??
    {}) as Partial<WorkflowWebhookEventObject>
  const workflowContent: WebhookData['workflowContent'] = {
    ...(liveData.workflowContent as object),
    workflowStep: snapshot.workflowStep,
    ...(Array.isArray(liveWorkflow.submittedSteps)
      ? {
          submittedSteps: liveWorkflow.submittedSteps.slice(
            0,
            submissionIndex + 1,
          ),
        }
      : {}),
  }

  const reconstructed: WebhookData = {
    formId: liveData.formId,
    submissionId: liveData.submissionId,
    created: liveData.created,
    // S8: switch to the snapshot's attachmentMetadata; for S4 the live-row
    // download URLs are used as-is.
    attachmentDownloadUrls: liveData.attachmentDownloadUrls,
    encryptedContent: snapshot.encryptedContent,
    verifiedContent: snapshot.verifiedContent,
    version: contentShapeToSubmissionVersion(snapshot.contentFormat),
    workflowContent,
  }

  if (liveData.paymentContent !== undefined) {
    reconstructed.paymentContent = liveData.paymentContent
  }

  // encryptedSubmissionSecretKey is sourced from the FROZEN snapshot, never
  // the live row. Only v4 snapshots carry it;
  // policy.includeEncryptedSubmissionSecretKey is only true for v4 content.
  // When the policy excludes it, the field is omitted entirely.
  if (
    policy.includeEncryptedSubmissionSecretKey &&
    snapshot.contentFormat === 'v4'
  ) {
    reconstructed.encryptedSubmissionSecretKey =
      snapshot.encryptedSubmissionSecretKey
  }

  return reconstructed
}
