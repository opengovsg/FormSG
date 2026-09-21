import { err, ok, Result } from 'neverthrow'

import { WebhookData } from 'src/types/submission'

import { SnapshotDataIntegrityError } from './submission-snapshot.errors'
import {
  SubmissionSnapshotV1,
  SubmissionSnapshotV4,
} from './submission-snapshot.schema'
import { StorageShapedWebhookData } from './v1-payload'
import {
  contentFormatToWebhookVersion,
  WebhookPayloadPolicy,
} from './webhook-payload-policy'

interface ReconstructMrfWebhookDataInputBase {
  liveData: WebhookData
  policy: WebhookPayloadPolicy
}

interface ReconstructMrfWebhookDataInputWithoutSnapshot extends ReconstructMrfWebhookDataInputBase {
  snapshot: undefined
  submissionIndex: undefined
}

interface ReconstructMrfWebhookDataInputWithSnapshot extends ReconstructMrfWebhookDataInputBase {
  snapshot: SubmissionSnapshotV4
  submissionIndex: number
}

type ReconstructMrfWebhookDataInput =
  | ReconstructMrfWebhookDataInputWithSnapshot
  | ReconstructMrfWebhookDataInputWithoutSnapshot

export const reconstructMrfWebhookData = (
  input: ReconstructMrfWebhookDataInput,
): Result<WebhookData, SnapshotDataIntegrityError> => {
  const { liveData, snapshot, submissionIndex, policy } = input

  if (snapshot === undefined) {
    // RATIONALE: The live row is always in `v4` shape, and should not be emitted if the policy requires a different format.
    if (policy.contentFormat !== 'v4') {
      return err(
        new SnapshotDataIntegrityError(
          'No snapshot available to reconstruct a non-v4 payload',
          {
            policyContentFormat: policy.contentFormat,
            submissionId: liveData.submissionId,
            formId: liveData.formId,
          },
        ),
      )
    }
    return ok(liveData)
  }

  if (policy.contentFormat !== snapshot.contentFormat) {
    return err(
      new SnapshotDataIntegrityError(
        'Resolved content format does not match the stored snapshot',
        {
          policyContentFormat: policy.contentFormat,
          storedContentFormat: snapshot.contentFormat,
          submissionId: liveData.submissionId,
          formId: liveData.formId,
        },
      ),
    )
  }

  const reconstructed: WebhookData = {
    formId: liveData.formId,
    submissionId: liveData.submissionId,
    created: liveData.created,
    attachmentDownloadUrls: snapshot.attachmentMetadata ?? {},
    encryptedContent: snapshot.encryptedContent,
    verifiedContent: snapshot.verifiedContent,
    version: contentFormatToWebhookVersion(snapshot.contentFormat),
  }

  const liveWorkflow = liveData.workflowContent

  if (liveWorkflow !== undefined) {
    reconstructed.workflowContent = {
      ...liveWorkflow,
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

// Pick fields explicitly so optional MRF-only keys cannot enter the V1 payload.
export const reconstructV1WebhookData = ({
  liveData,
  snapshot,
}: {
  liveData: WebhookData
  snapshot: SubmissionSnapshotV1
}): StorageShapedWebhookData => ({
  formId: liveData.formId,
  submissionId: liveData.submissionId,
  encryptedContent: snapshot.encryptedContent,
  verifiedContent: snapshot.verifiedContent,
  version: contentFormatToWebhookVersion(snapshot.contentFormat),
  created: liveData.created,
  attachmentDownloadUrls: snapshot.attachmentMetadata ?? {},
  paymentContent: liveData.paymentContent,
})
