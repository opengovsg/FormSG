import { PutObjectRequest } from 'aws-sdk/clients/s3'
import crypto from 'crypto'
import { errAsync, ResultAsync } from 'neverthrow'

import { aws as AwsConfig } from '../../../../config/config'
import { createLoggerWithLabel } from '../../../../config/logger'

import {
  SnapshotDataIntegrityError,
  SnapshotWriteError,
} from './submission-snapshot.errors'
import {
  parseSnapshot,
  SubmissionSnapshot,
  SubmissionSnapshotV4,
} from './submission-snapshot.schema'

const logger = createLoggerWithLabel(module)

/**
 * Number of create-if-absent attempts before we stop retrying.
 */
const MAX_WRITE_ATTEMPTS = 2

type SnapshotKeyParams = {
  formId: string
  submissionId: string
  submissionIndex: number
  token: string
}

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

export const writeV4Snapshot = (
  snapshot: SubmissionSnapshotV4,
): ResultAsync<{ token: string; key: string }, SnapshotWriteError> => {
  const body = JSON.stringify(snapshot)

  const attempt = (
    attemptsLeft: number,
  ): ResultAsync<{ token: string; key: string }, SnapshotWriteError> => {
    const token = crypto.randomUUID()
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
          new SnapshotDataIntegrityError('Submission snapshot body is empty'),
        )
      }
      return parseSnapshot(body)
    })
    .orElse((error) => {
      // andThen already produced a SnapshotDataIntegrityError for parse failures;
      // pass those through untouched.
      if (error instanceof SnapshotDataIntegrityError) {
        return errAsync(error)
      }
      if (isNoSuchKey(error)) {
        return errAsync(
          new SnapshotDataIntegrityError(
            'Submission snapshot is missing',
            error,
          ),
        )
      }
      logger.error({
        message: 'Snapshot read failed',
        meta: { action: 'readV4Snapshot', key },
        error: error as Error,
      })
      return errAsync(new SnapshotDataIntegrityError(undefined, error))
    })
}
