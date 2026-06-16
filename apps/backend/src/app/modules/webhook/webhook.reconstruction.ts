import { SubmittedStep } from 'formsg-shared/types'

import { WebhookView } from '../../../types'
import {
  ContentFormat,
  SubmissionHistorySnapshot,
} from '../../../types/submission_history'

import { SubmissionHistoryMissingError } from './webhook.errors'
import { getWebhookPayloadPolicy, WebhookType } from './webhook.policy'
import { WorkflowWebhookEventObject } from './webhook.types'

/**
 * Derives the consumer-visible webhook protocol `version` from the snapshot's
 * storage-only `contentFormat`. The protocol number is never persisted.
 */
const deriveVersion = (contentFormat: ContentFormat): number =>
  contentFormat === 'v4' ? 3 : 2.1

type ReconstructWebhookViewArgs = {
  /**
   * Today's live-row webhook payload (from `submission.getWebhookView()`).
   * Source of all stable/reconstructible fields (formId, submissionId,
   * created, payment, workflow definition, attachments, the wrapped key).
   */
  liveView: WebhookView
  /** Classification of the form's webhook URL — drives the payload policy. */
  webhookType: WebhookType
  /**
   * Zero-based position of the step being delivered. Its presence selects the
   * reconstruction branch: present => snapshot-backed (V4) reconstruction;
   * absent => today's live-row payload unchanged.
   */
  submissionIndex?: number
  /** The step's snapshot; required when `submissionIndex` is given. */
  snapshot?: SubmissionHistorySnapshot | null
}

/**
 * Reconstructs the webhook payload for an MRF step (M1). A pure function: the
 * initial send and any later retry flow through here, which is what makes them
 * byte-identical.
 *
 * Two branches, keyed on whether a `submissionIndex` is given:
 * - **With** a `submissionIndex` (initial V4 send / new-type retry): the
 *   snapshot must exist; a missing one is a data-integrity error (fail loud,
 *   never silently fall back). Content/verified/version/workflowStep come from
 *   the snapshot; `submittedSteps` is the live row's append-only prefix; the
 *   wrapped secret key is kept only per the send-time policy.
 * - **Without** a `submissionIndex` (V3 / plumber-today / legacy): returns
 *   exactly today's live-row payload — no behaviour change.
 */
export function reconstructWebhookView({
  liveView,
  webhookType,
  submissionIndex,
  snapshot,
}: ReconstructWebhookViewArgs): WebhookView {
  // Legacy branch: no submissionIndex => today's live-row payload, unchanged.
  if (submissionIndex === undefined) {
    return liveView
  }

  // Snapshot-backed branch: a missing snapshot is a data-integrity error that
  // must fail loud (surfaced/alarmed) — never a silent fall back to the stale
  // live-row payload. The caller (the webhook sender) maps this thrown error
  // back into its neverthrow chain.
  if (!snapshot) {
    // eslint-disable-next-line typesafe/no-throw-sync-func
    throw new SubmissionHistoryMissingError(
      liveView.data.submissionId,
      submissionIndex,
    )
  }

  const liveWorkflowContent = liveView.data
    .workflowContent as WorkflowWebhookEventObject
  // `submittedSteps` is append-only, so the prefix is the historical state.
  const submittedSteps: SubmittedStep[] =
    liveWorkflowContent.submittedSteps.slice(0, submissionIndex + 1)

  const policy = getWebhookPayloadPolicy({
    webhookType,
    submissionIndex,
    // "Latest step" is judged against the LIVE ROW's step count, not the
    // reconstructed prefix: the wrapped key is the row's current-step key,
    // invalidated once a later step is submitted (ADR-0002).
    submittedStepsLength: liveWorkflowContent.submittedSteps.length,
  })

  return {
    data: {
      ...liveView.data,
      // From the snapshot (the irreproducible per-step bits):
      encryptedContent: snapshot.encryptedContent,
      verifiedContent: snapshot.verifiedContent,
      version: deriveVersion(snapshot.contentFormat),
      workflowContent: {
        ...liveWorkflowContent,
        workflowStep: snapshot.workflowStep,
        submittedSteps,
      },
      // Send-time policy: the wrapped key is a write credential, attached only
      // for a privileged consumer on the latest step.
      encryptedSubmissionSecretKey: policy.includeSecretKey
        ? liveView.data.encryptedSubmissionSecretKey
        : undefined,
    },
  }
}
