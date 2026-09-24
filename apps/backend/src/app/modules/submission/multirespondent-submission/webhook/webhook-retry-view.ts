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

export type SnapshotRetryError =
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
 * Rebuilds the webhook payload a retry must deliver from the provided
 * snapshot reference.
 */
export const resolveSnapshotRetryView = ({
  liveView,
  submissionId,
  snapshotRef,
  submittedStepSnapshotTokens,
}: {
  liveView: WebhookView
  submissionId: string
  snapshotRef: SnapshotRef
  submittedStepSnapshotTokens?: (SubmittedStepSnapshotTokens | undefined)[]
}): ResultAsync<WebhookView, SnapshotRetryError> => {
  const meta = { submissionId, snapshotRef }
  const { submissionIndex, contentFormat } = snapshotRef

  const recordedTokensForSubmissionIndex =
    submittedStepSnapshotTokens?.[submissionIndex]
  const token = recordedTokensForSubmissionIndex?.[contentFormat]
  if (!token) {
    return errAsync(new SnapshotFormatNotRecordedError(undefined, meta))
  }

  return readSnapshot({
    formId: liveView.data.formId,
    submissionId,
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

    // V1 must replay the form-key copy through the initial send's reconstruction.
    // The native V4 row is never a valid fallback for a missing V1 snapshot.
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
