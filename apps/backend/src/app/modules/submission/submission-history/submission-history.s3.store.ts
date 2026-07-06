import crypto from 'crypto'
import { err, errAsync, ok, Result, ResultAsync } from 'neverthrow'

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
 * S3 `PutObject` error code returned when an `If-None-Match: *` create-if-absent
 * write hits an already-existing key (a token collision).
 */
const PRECONDITION_FAILED_CODE = 'PreconditionFailed'

/**
 * Bound on token re-minting attempts on collision. A single collision is already
 * astronomically unlikely (random UUIDv4 within one `{formId, submissionId,
 * submissionIndex}`); more than a couple in a row means something is wrong.
 */
export const MAX_SAVE_ATTEMPTS = 3

/**
 * S3 object key for a snapshot:
 *   `{formId}/{submissionId}/{submissionIndex}/{format}/{snapshotToken}`
 * Form-id-first / slash-delimited (mirrors the attachment key style) so it
 * supports both direct lookup (webhook retry) and prefix listing (audit by
 * form or by submission). `format` distinguishes the payload variants a single
 * step may snapshot (v4 for privileged consumers, v1 for generic); the trailing
 * segment is a per-attempt nonce, so two concurrent writes to the same step and
 * format never target the same object (ADR-0004). Exported for testing and as
 * the documented layout.
 */
export const buildSnapshotS3Key = ({
  formId,
  submissionId,
  submissionIndex,
  format,
  snapshotToken,
}: SnapshotLocator): string =>
  `${formId}/${submissionId}/${submissionIndex}/${format}/${snapshotToken}`

const isPreconditionFailed = (error: unknown): boolean =>
  !!error &&
  typeof error === 'object' &&
  (error as { code?: string }).code === PRECONDITION_FAILED_CODE

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
 * Each snapshot is written to a unique, per-attempt key (nonce token) with a
 * create-if-absent (`If-None-Match: *`) `PutObject`, so an object is written
 * exactly once and never overwritten — the reader, given the token recorded on
 * the committed row, resolves to exactly that immutable object (ADR-0004).
 */
export class S3SubmissionHistoryStore implements ISubmissionHistoryStore {
  saveSnapshot(
    snapshot: SubmissionHistorySnapshot,
    format: SnapshotFormat,
  ): ResultAsync<{ snapshotToken: string }, SubmissionHistoryUploadError> {
    const body = JSON.stringify(snapshot)

    // Retry via re-minting: on the (astronomically rare) key collision, mint a
    // fresh token and try again. S3 — not UUID collision-resistance alone —
    // enforces "at most one object per key, never mutated".
    const attempt = (
      remaining: number,
    ): ResultAsync<{ snapshotToken: string }, SubmissionHistoryUploadError> => {
      const snapshotToken = crypto.randomUUID()
      const key = buildSnapshotS3Key({
        formId: snapshot.formId,
        submissionId: snapshot.submissionId,
        submissionIndex: snapshot.submissionIndex,
        format,
        snapshotToken,
      })

      return ResultAsync.fromPromise(
        AwsConfig.s3
          .putObject({
            Bucket: AwsConfig.submissionHistoryS3Bucket,
            Key: key,
            Body: body,
            ContentType: 'application/json',
            IfNoneMatch: '*',
          })
          .promise(),
        (error) => error,
      )
        .map(() => ({ snapshotToken }))
        .orElse((error) => {
          if (isPreconditionFailed(error) && remaining > 1) {
            logger.warn({
              message:
                'Submission history snapshot key collision; re-minting token',
              meta: {
                action: 'saveSnapshot',
                formId: snapshot.formId,
                submissionId: snapshot.submissionId,
                submissionIndex: snapshot.submissionIndex,
                key,
              },
            })
            return attempt(remaining - 1)
          }
          logger.error({
            message: 'Failed to upload submission history snapshot to S3',
            meta: {
              action: 'saveSnapshot',
              formId: snapshot.formId,
              submissionId: snapshot.submissionId,
              submissionIndex: snapshot.submissionIndex,
              format,
              key,
            },
            error,
          })
          return errAsync(new SubmissionHistoryUploadError())
        })
    }

    return attempt(MAX_SAVE_ATTEMPTS)
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
