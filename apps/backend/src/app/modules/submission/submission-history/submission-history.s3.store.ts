import { err, ok, Result, ResultAsync } from 'neverthrow'

import { aws as AwsConfig } from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'

import {
  SubmissionHistoryMalformedError,
  SubmissionHistoryNotFoundError,
  SubmissionHistoryUploadError,
} from './submission-history.errors'
import type { ISubmissionHistoryStore } from './submission-history.store'
import {
  SnapshotFormat,
  SnapshotLocator,
  SubmissionHistorySnapshot,
  submissionHistorySnapshotSchema,
} from './submission-history.types'

const logger = createLoggerWithLabel(module)

/**
 * S3 object key for a snapshot:
 *   `{formId}/{submissionId}/{submissionIndex}/{format}.json`
 * Form-id-first / slash-delimited (mirrors the attachment key style) so it
 * supports both direct lookup (webhook retry) and prefix listing (audit by
 * form or by submission). Exported for testing and as the documented layout.
 */
export const buildSnapshotS3Key = ({
  formId,
  submissionId,
  submissionIndex,
  format,
}: SnapshotLocator): string =>
  `${formId}/${submissionId}/${submissionIndex}/${format}.json`

const parseSnapshot = (
  raw: string | undefined,
): Result<SubmissionHistorySnapshot, SubmissionHistoryMalformedError> => {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw ?? '')
  } catch {
    return err(new SubmissionHistoryMalformedError())
  }
  const result = submissionHistorySnapshotSchema.safeParse(parsed)
  if (!result.success) {
    return err(new SubmissionHistoryMalformedError())
  }
  return ok(result.data)
}

/**
 * S3-backed implementation of {@link ISubmissionHistoryStore}.
 *
 * Reuses the established aws-sdk v2 `s3.upload(...).promise()` pattern (see
 * `payment-proof.service.ts`). Plain overwrite on write; the bucket is created
 * with versioning enabled at the infra level.
 */
export class S3SubmissionHistoryStore implements ISubmissionHistoryStore {
  saveSnapshot(
    snapshot: SubmissionHistorySnapshot,
    format: SnapshotFormat,
  ): ResultAsync<true, SubmissionHistoryUploadError> {
    const key = buildSnapshotS3Key({
      formId: snapshot.formId,
      submissionId: snapshot.submissionId,
      submissionIndex: snapshot.submissionIndex,
      format,
    })

    return ResultAsync.fromPromise(
      AwsConfig.s3
        .upload({
          Bucket: AwsConfig.submissionHistoryS3Bucket,
          Key: key,
          Body: JSON.stringify(snapshot),
          ContentType: 'application/json',
        })
        .promise(),
      (error) => {
        logger.error({
          message: 'Failed to upload submission history snapshot to S3',
          meta: {
            action: 'saveSnapshot',
            formId: snapshot.formId,
            submissionId: snapshot.submissionId,
            submissionIndex: snapshot.submissionIndex,
            key,
          },
          error,
        })
        return new SubmissionHistoryUploadError()
      },
    ).map(() => true as const)
  }

  getSnapshot(
    locator: SnapshotLocator,
  ): ResultAsync<
    SubmissionHistorySnapshot,
    SubmissionHistoryNotFoundError | SubmissionHistoryMalformedError
  > {
    const key = buildSnapshotS3Key(locator)

    return ResultAsync.fromPromise(
      AwsConfig.s3
        .getObject({
          Bucket: AwsConfig.submissionHistoryS3Bucket,
          Key: key,
        })
        .promise(),
      (error) => {
        logger.error({
          message: 'Failed to fetch submission history snapshot from S3',
          meta: { action: 'getSnapshot', ...locator, key },
          error,
        })
        return new SubmissionHistoryNotFoundError()
      },
    ).andThen((output) => parseSnapshot(output.Body?.toString()))
  }
}
