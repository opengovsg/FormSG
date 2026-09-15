import { SubmittedStepSnapshotTokens } from 'formsg-shared/types'
import { errAsync, ResultAsync } from 'neverthrow'

import { WebhookView } from '../../../../../types'
import { SnapshotRef } from '../../../webhook/webhook.types'

import {
  SnapshotAccessDeniedError,
  SnapshotDataIntegrityError,
  SnapshotFormatNotRecordedError,
  SnapshotReadError,
} from './submission-snapshot.errors'
import { readV4Snapshot } from './submission-snapshot.store'
import {
  getKeyPermissionsPolicy,
  WebhookConsumerType,
  WebhookPayloadPolicy,
} from './webhook-payload-policy'
import { reconstructMrfWebhookData } from './webhook-reconstruction'

export type SnapshotRetryError =
  | SnapshotDataIntegrityError
  | SnapshotReadError
  | SnapshotAccessDeniedError
  | SnapshotFormatNotRecordedError

interface GetRecordedPayloadPolicyInput {
  snapshotRef: SnapshotRef
  webhookType: WebhookConsumerType
  submittedStepsLength: number
}

export const getRecordedPayloadPolicy = ({
  snapshotRef,
  webhookType,
  submittedStepsLength,
}: GetRecordedPayloadPolicyInput): WebhookPayloadPolicy => {
  const { contentFormat, submissionIndex } = snapshotRef
  const keyPermissionsPolicy = getKeyPermissionsPolicy({
    webhookType,
    submissionIndex,
    submittedStepsLength,
    contentFormat,
  })
  return {
    contentFormat,
    ...keyPermissionsPolicy,
  }
}

/**
 * Rebuilds the webhook payload a retry must deliver from the provided
 * snapshot reference.
 */
export const resolveSnapshotRetryView = ({
  liveView,
  submissionId,
  snapshotRef,
  submittedStepSnapshotTokens,
  webhookType,
}: {
  liveView: WebhookView
  submissionId: string
  snapshotRef: SnapshotRef
  submittedStepSnapshotTokens?: (SubmittedStepSnapshotTokens | undefined)[]
  webhookType: WebhookConsumerType
}): ResultAsync<WebhookView, SnapshotRetryError> => {
  const meta = { submissionId, snapshotRef }
  const { submissionIndex, contentFormat } = snapshotRef
  const { workflowContent } = liveView.data
  const submittedStepsLength = workflowContent?.submittedSteps?.length ?? 0

  // RATIONALE: Only `v4` exists today, so a message naming `v1`
  // resolves to not recorded until future backward compatibility to
  // widens the row schema to carry the v1 copy.
  if (contentFormat === 'v1') {
    return errAsync(new SnapshotFormatNotRecordedError(undefined, meta))
  }
  const recordedTokensForSubmissionIndex =
    submittedStepSnapshotTokens?.[submissionIndex]
  const token = recordedTokensForSubmissionIndex?.[contentFormat]
  if (!token) {
    return errAsync(new SnapshotFormatNotRecordedError(undefined, meta))
  }

  return readV4Snapshot({
    formId: liveView.data.formId,
    submissionId,
    submissionIndex,
    token,
  }).andThen((snapshot) => {
    if (snapshot.contentFormat !== contentFormat) {
      return errAsync(
        new SnapshotDataIntegrityError(
          'Stored snapshot is not in the content format it was recorded under',
          { ...meta, storedContentFormat: snapshot.contentFormat },
        ),
      )
    }

    return reconstructMrfWebhookData({
      liveData: liveView.data,
      snapshot,
      submissionIndex,
      policy: getRecordedPayloadPolicy({
        snapshotRef,
        webhookType,
        submittedStepsLength,
      }),
    }).map((data) => ({ data }))
  })
}
