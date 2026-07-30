import { PutObjectRequest } from 'aws-sdk/clients/s3'
import crypto from 'crypto'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { aws as AwsConfig } from '../../../../config/config'
import { createLoggerWithLabel } from '../../../../config/logger'
import { ApplicationError } from '../../../core/core.errors'

import {
  parseSnapshot,
  SnapshotDataIntegrityError,
  SubmissionSnapshot,
  SubmissionSnapshotV4,
} from './submission-snapshot.schema'

const logger = createLoggerWithLabel(module)

/**
 * Number of create-if-absent attempts before we stop retrying. Each attempt
 * uses a FRESH token (hence a fresh key). A genuine token collision is
 * astronomically unlikely, so exhausting the bound means something is wrong
 * (e.g. a persistent non-collision 412) — we fail loud rather than loop.
 */
const MAX_WRITE_ATTEMPTS = 5

export const SNAPSHOT_WRITE_ERROR_CODE = 'MRF_WEBHOOK_SNAPSHOT_WRITE'

/**
 * Raised when a snapshot cannot be durably written — either S3 rejected the
 * PUT for a non-collision reason, or the bounded create-if-absent retry loop
 * exhausted its attempts. NEVER raised by silently overwriting: `IfNoneMatch`
 * is on every attempt, so an existing object is never clobbered.
 */
export class SnapshotWriteError extends ApplicationError {
  readonly writeCode = SNAPSHOT_WRITE_ERROR_CODE

  constructor(message = 'Failed to write submission snapshot', meta?: unknown) {
    super(`[${SNAPSHOT_WRITE_ERROR_CODE}] ${message}`, meta)
  }
}

type SnapshotKeyParams = {
  formId: string
  submissionId: string
  submissionIndex: number
  token: string
}

/**
 * The ONLY place a snapshot S3 key is constructed. Writer and reader both go
 * through this so a key can never be built two different ways.
 *
 * submissionIndex is emitted raw (NOT zero-padded).
 */
export const buildSnapshotKey = ({
  formId,
  submissionId,
  submissionIndex,
  token,
}: SnapshotKeyParams): string =>
  `${formId}/${submissionId}/${submissionIndex}/${token}.json`

/**
 * Returns true if the S3 error signals a create-if-absent precondition failure
 * (the key already exists), i.e. a token collision we should retry.
 */
const isPreconditionFailed = (error: unknown): boolean => {
  const s3Error = error as { code?: string; statusCode?: number } | null
  return (
    !!s3Error &&
    (s3Error.code === 'PreconditionFailed' || s3Error.statusCode === 412)
  )
}

const isNoSuchKey = (error: unknown): boolean => {
  const s3Error = error as { code?: string; statusCode?: number } | null
  return (
    !!s3Error && (s3Error.code === 'NoSuchKey' || s3Error.statusCode === 404)
  )
}

/**
 * Create-if-absent writer with bounded collision retry. Generates a token,
 * builds the key, and PUTs with `IfNoneMatch: '*'` so S3 refuses to overwrite
 * an existing object (HTTP 412). On a 412 it retries with a FRESH token (new
 * key), bounded to MAX_WRITE_ATTEMPTS. A non-412 rejection, or exhausting the
 * bound, fails loud with SnapshotWriteError. Never overwrites.
 *
 * The Body is `JSON.stringify(snapshot)`, which round-trips through
 * `parseSnapshot` on read.
 */
export const writeV4Snapshot = (
  snapshot: SubmissionSnapshotV4,
  deps?: { generateToken?: () => string },
): ResultAsync<{ token: string; key: string }, SnapshotWriteError> => {
  const generateToken = deps?.generateToken ?? (() => crypto.randomUUID())
  const body = JSON.stringify(snapshot)

  const attempt = (
    attemptsLeft: number,
  ): ResultAsync<{ token: string; key: string }, SnapshotWriteError> => {
    const token = generateToken()
    const key = buildSnapshotKey({
      formId: snapshot.formId,
      submissionId: snapshot.submissionId,
      submissionIndex: snapshot.submissionIndex,
      token,
    })

    const params: PutObjectRequest = {
      Bucket: AwsConfig.submissionHistoryV4S3Bucket,
      Key: key,
      Body: body,
      ContentType: 'application/json',
      // Create-if-absent: S3 returns 412 PreconditionFailed if the key exists.
      IfNoneMatch: '*',
    }

    return ResultAsync.fromPromise(
      AwsConfig.s3.putObject(params).promise(),
      (error) => error,
    )
      .map(() => ({ token, key }))
      .orElse((error) => {
        if (isPreconditionFailed(error)) {
          if (attemptsLeft <= 1) {
            logger.error({
              message:
                'Snapshot write exhausted retries on persistent precondition failure',
              meta: {
                action: 'writeV4Snapshot',
                formId: snapshot.formId,
                submissionId: snapshot.submissionId,
                submissionIndex: snapshot.submissionIndex,
              },
              error: error as Error,
            })
            return errAsync(
              new SnapshotWriteError(
                'Persistent precondition failure writing snapshot',
                error,
              ),
            )
          }
          // Genuine collision (or transient 412): retry with a fresh token.
          return attempt(attemptsLeft - 1)
        }

        logger.error({
          message: 'Snapshot write failed',
          meta: {
            action: 'writeV4Snapshot',
            formId: snapshot.formId,
            submissionId: snapshot.submissionId,
            submissionIndex: snapshot.submissionIndex,
          },
          error: error as Error,
        })
        return errAsync(new SnapshotWriteError(undefined, error))
      })
  }

  return attempt(MAX_WRITE_ATTEMPTS)
}

/**
 * Point read by the recorded token. Builds the key via `buildSnapshotKey`,
 * fetches the object, and parses the Body through `parseSnapshot`. A missing
 * object (NoSuchKey / 404) or a malformed body / unknown `_v` both surface the
 * SAME SnapshotDataIntegrityError. Never falls back to anything.
 */
export const readV4Snapshot = ({
  formId,
  submissionId,
  submissionIndex,
  token,
}: SnapshotKeyParams): ResultAsync<
  SubmissionSnapshot,
  SnapshotDataIntegrityError
> => {
  const key = buildSnapshotKey({
    formId,
    submissionId,
    submissionIndex,
    token,
  })

  return ResultAsync.fromPromise(
    AwsConfig.s3
      .getObject({ Bucket: AwsConfig.submissionHistoryV4S3Bucket, Key: key })
      .promise(),
    (error) => error,
  )
    .andThen((data) => {
      const body = data.Body?.toString()
      if (body === undefined) {
        return errAsync(
          new SnapshotDataIntegrityError('Snapshot body is empty'),
        )
      }
      try {
        return okAsync(parseSnapshot(body))
      } catch (parseError) {
        return errAsync(
          parseError instanceof SnapshotDataIntegrityError
            ? parseError
            : new SnapshotDataIntegrityError(undefined, parseError),
        )
      }
    })
    .orElse((error) => {
      // andThen already produced a SnapshotDataIntegrityError for parse failures;
      // pass those through untouched.
      if (error instanceof SnapshotDataIntegrityError) {
        return errAsync(error)
      }
      if (isNoSuchKey(error)) {
        return errAsync(new SnapshotDataIntegrityError('missing', error))
      }
      logger.error({
        message: 'Snapshot read failed',
        meta: { action: 'readV4Snapshot', key },
        error: error as Error,
      })
      return errAsync(new SnapshotDataIntegrityError(undefined, error))
    })
}
