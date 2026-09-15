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

/**
 * Reconstructs the native V4 payload, which the live row can also express: a
 * V4 delivery with no snapshot has a byte-correct fallback in `liveData`.
 *
 * The V1 branch is deliberately a different function with a different return
 * type, because that asymmetry is real and load-bearing — see
 * {@link reconstructV1WebhookData}. Resist unifying them; the types exist so
 * that an attempt fails to compile.
 */
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

/**
 * Reconstructs the storage-shaped V1 payload from the frozen snapshot.
 *
 * `snapshot` is a required parameter of a V1-only type, so the forbidden
 * live-row fallback (PIN-01) is not expressible here rather than merely
 * avoided: with no object there is no call to make. The asymmetry with the V4
 * branch above is the point — for V4 the live row IS the wire payload, so a
 * missing snapshot degrades to something byte-correct; for V1 the row holds
 * ciphertext under a submission key the server cannot open, so it is never a
 * valid V1 payload and there is nothing to degrade to.
 *
 * Fields are picked explicitly, never spread from `liveData`. A
 * `{ ...liveData, encryptedContent }` would reintroduce `workflowContent` and
 * `encryptedSubmissionSecretKey` with no compiler error at all, because
 * excess-property checking does not apply to spread results.
 *
 * It takes no policy: a V1 payload's key permissions are not a decision. The
 * content is encrypted to the form public key, so a wrapped per-submission key
 * would be useless to the consumer and a leak to store for it.
 */
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
