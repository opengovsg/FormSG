import { SubmittedStepSnapshotTokens } from 'formsg-shared/types'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { WebhookView } from '../../../../../types'
import { SnapshotRef } from '../../../webhook/webhook.types'

import {
  SnapshotAccessDeniedError,
  SnapshotDataIntegrityError,
  SnapshotFormatNotRecordedError,
  SnapshotReadError,
} from './submission-snapshot.errors'
import { readSnapshot } from './submission-snapshot.store'
import {
  getKeyPermissionsPolicy,
  WebhookPayloadPolicy,
} from './webhook-payload-policy'
import {
  reconstructMrfWebhookData,
  reconstructV1WebhookData,
} from './webhook-reconstruction'

export type SnapshotViewError =
  | SnapshotDataIntegrityError
  | SnapshotReadError
  | SnapshotAccessDeniedError
  | SnapshotFormatNotRecordedError

export const getRecordedPayloadPolicy = ({
  snapshotRef,
}: {
  snapshotRef: SnapshotRef
}): WebhookPayloadPolicy => {
  const { contentFormat } = snapshotRef
  return {
    contentFormat,
    ...getKeyPermissionsPolicy({ contentFormat }),
  }
}

/**
 * Rebuilds the webhook payload for initial delivery or retries from the
 * provided snapshot reference.
 * First-step payment snapshots belong to the pending submission; later steps
 * belong to the completed submission.
 */
export const resolveSnapshotWebhookView = ({
  liveView,
  submissionId,
  pendingSubmissionId,
  snapshotRef,
  submittedStepSnapshotTokens,
}: {
  liveView: WebhookView
  submissionId: string
  pendingSubmissionId?: string
  snapshotRef: SnapshotRef
  submittedStepSnapshotTokens?: (SubmittedStepSnapshotTokens | undefined)[]
}): ResultAsync<WebhookView, SnapshotViewError> => {
  // RATIONALE: Only payments has a pendingSubmissionId which its snapshot is keyed by
  // and payments currently only support 1 step workflows.
  // Thus, if pendingSubmissionId is present, use it to lookup the snapshot.
  // Otherwise, it is a non-payment submission and we use the submissionId.
  const isPaymentsFirstStep =
    snapshotRef.submissionIndex === 0 && pendingSubmissionId !== undefined
  const snapshotSubmissionId = isPaymentsFirstStep
    ? pendingSubmissionId
    : submissionId
  const meta = {
    submissionId,
    pendingSubmissionId,
    snapshotRef,
  }
  const { submissionIndex, contentFormat } = snapshotRef

  const recordedTokensForSubmissionIndex =
    submittedStepSnapshotTokens?.[submissionIndex]
  const token = recordedTokensForSubmissionIndex?.[contentFormat]
  if (!token) {
    return errAsync(new SnapshotFormatNotRecordedError(undefined, meta))
  }

  return readSnapshot({
    formId: liveView.data.formId,
    submissionId: snapshotSubmissionId,
    submissionIndex,
    token,
    contentFormat,
  }).andThen((snapshot) => {
    if (snapshot.contentFormat !== contentFormat) {
      return errAsync(
        new SnapshotDataIntegrityError(
          'Stored snapshot is not in the content format it was recorded under',
          { ...meta, storedContentFormat: snapshot.contentFormat },
        ),
      )
    }

    if (snapshot.contentFormat === 'v1') {
      return okAsync({
        data: reconstructV1WebhookData({ liveData: liveView.data, snapshot }),
      })
    }

    return reconstructMrfWebhookData({
      liveData: liveView.data,
      snapshot,
      submissionIndex,
      policy: getRecordedPayloadPolicy({ snapshotRef }),
    }).map((data) => ({ data }))
  })
}
