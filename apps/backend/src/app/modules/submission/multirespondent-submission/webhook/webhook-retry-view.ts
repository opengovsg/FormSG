import { SubmittedStepSnapshotTokens } from 'formsg-shared/types'
import { errAsync, ResultAsync } from 'neverthrow'

import { WebhookView } from '../../../../../types'
import { QueueMessageContentFormat } from '../../../webhook/webhook.types'

import {
  SnapshotAccessDeniedError,
  SnapshotDataIntegrityError,
  SnapshotFormatNotRecordedError,
  SnapshotReadError,
} from './submission-snapshot.errors'
import { readV4Snapshot } from './submission-snapshot.store'
import { WebhookPayloadPolicy } from './webhook-payload-policy'
import { reconstructMrfWebhookData } from './webhook-reconstruction'

export type SnapshotRetryError =
  | SnapshotDataIntegrityError
  | SnapshotReadError
  | SnapshotAccessDeniedError
  | SnapshotFormatNotRecordedError

/**
 * The policy for a retry is read off the queue message, never re-derived. The
 * message names the wire shape recorded at enqueue time, so an admin toggling
 * `webhookFormat`, or an operator flipping a feature flag, in between cannot
 * change what the retry delivers — in particular it can never upgrade a
 * generic consumer's payload into one carrying the submission read key.
 */
export const getRecordedPayloadPolicy = (
  contentFormat: QueueMessageContentFormat,
): WebhookPayloadPolicy => ({
  contentFormat,
  includeEncryptedSubmissionSecretKey: contentFormat === 'v4',
  // A step token is only ever minted for the step being advanced to on an
  // initial send; a retry never re-mints one.
  includeEncryptedStepToken: false,
})

/**
 * Rebuilds the payload a retry must deliver from the snapshot frozen for that
 * step submission. Identity is the monotonic `submissionIndex`, not
 * `workflowStep`, which repeats on loop-back.
 *
 * There is deliberately no live-row fallback: a snapshot that is missing or
 * unreadable fails loud, since falling back would ship the latest step's
 * content under an earlier step's identity.
 */
export const resolveSnapshotRetryView = ({
  liveView,
  submissionId,
  submissionIndex,
  contentFormat,
  snapshotTokens,
}: {
  liveView: WebhookView
  submissionId: string
  submissionIndex: number
  contentFormat: QueueMessageContentFormat
  /** Tokens recorded on the row's step submissions, indexed by submissionIndex. */
  snapshotTokens?: (SubmittedStepSnapshotTokens | undefined)[]
}): ResultAsync<WebhookView, SnapshotRetryError> => {
  const meta = { submissionId, submissionIndex, contentFormat }

  // The row records tokens keyed by content format. Only `v4` exists today, so
  // a message naming `v1` correctly finds nothing recorded until S6 (#9746)
  // widens the row schema to carry the v1 copy.
  const recordedTokens = snapshotTokens?.[submissionIndex] as
    | Partial<Record<QueueMessageContentFormat, string>>
    | undefined

  const token = recordedTokens?.[contentFormat]
  if (!token) {
    // Produce and deliver disagreed: the message names a format for which this
    // step submission recorded nothing. Operationally routine, and distinct
    // from the stored object being missing or corrupt.
    return errAsync(new SnapshotFormatNotRecordedError(undefined, meta))
  }

  return readV4Snapshot({
    formId: liveView.data.formId,
    submissionId,
    submissionIndex,
    token,
  }).andThen((snapshot) => {
    if (snapshot.contentFormat !== contentFormat) {
      // The object recorded under this format's token is in another format —
      // the stored object contradicts the row, which is an integrity failure.
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
      policy: getRecordedPayloadPolicy(contentFormat),
    }).map((data) => ({ data }))
  })
}
