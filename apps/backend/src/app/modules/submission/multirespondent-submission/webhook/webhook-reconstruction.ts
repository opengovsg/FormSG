import { err, ok, Result } from 'neverthrow'

import { WorkflowWebhookEventObject } from 'src/app/modules/webhook/webhook.types'
import { WebhookData } from 'src/types/submission'

import { SnapshotDataIntegrityError } from './submission-snapshot.errors'
import { SubmissionSnapshot } from './submission-snapshot.schema'
import {
  contentFormatToWebhookVersion,
  WebhookPayloadPolicy,
} from './webhook-payload-policy'

export const reconstructMrfWebhookData = (input: {
  liveData: WebhookData
  snapshot?: SubmissionSnapshot
  submissionIndex?: number
  policy: WebhookPayloadPolicy
}): Result<WebhookData, SnapshotDataIntegrityError> => {
  const { liveData, snapshot, submissionIndex, policy } = input

  if (submissionIndex === undefined) {
    return ok(liveData)
  }

  if (!snapshot) {
    return err(
      new SnapshotDataIntegrityError(
        'Snapshot missing on the snapshot reconstruction path',
        { submissionId: liveData.submissionId, submissionIndex },
      ),
    )
  }

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
    attachmentDownloadUrls: snapshot.attachmentMetadata ?? {},
    encryptedContent: snapshot.encryptedContent,
    verifiedContent: snapshot.verifiedContent,
    version: contentFormatToWebhookVersion(snapshot.contentFormat),
    workflowContent,
  }

  if (liveData.paymentContent !== undefined) {
    reconstructed.paymentContent = liveData.paymentContent
  }

  if (
    policy.includeEncryptedSubmissionSecretKey &&
    snapshot.contentFormat === 'v4'
  ) {
    reconstructed.encryptedSubmissionSecretKey =
      snapshot.encryptedSubmissionSecretKey
  }

  return ok(reconstructed)
}
