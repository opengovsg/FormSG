import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  PutObjectCommandInput,
  S3ServiceException,
} from '@aws-sdk/client-s3'
import crypto from 'crypto'
import { errAsync, ResultAsync } from 'neverthrow'

import { aws as AwsConfig } from '../../../../config/config'
import { createLoggerWithLabel } from '../../../../config/logger'

import {
  SnapshotAccessDeniedError,
  SnapshotDataIntegrityError,
  SnapshotReadError,
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
const isPreconditionFailed = (error: unknown): error is S3ServiceException =>
  error instanceof S3ServiceException && error.name === 'PreconditionFailed'

const isNoSuchKey = (error: unknown): error is NoSuchKey | S3ServiceException =>
  error instanceof NoSuchKey ||
  (error instanceof S3ServiceException && error.name === 'NoSuchKey')

const isAccessDenied = (error: unknown): error is S3ServiceException => {
  return error instanceof S3ServiceException && error.name === 'AccessDenied'
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

    const params: PutObjectCommandInput = {
      Bucket: AwsConfig.submissionHistoryV4S3Bucket,
      Key: key,
      Body: body,
      ContentType: 'application/json',
      // Create-if-absent: S3 returns 412 PreconditionFailed if the key exists.
      IfNoneMatch: '*',
    }

    return ResultAsync.fromPromise(
      AwsConfig.s3.send(new PutObjectCommand(params)),
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
              error,
            })
            return errAsync(
              new SnapshotWriteError(
                'Persistent precondition failure writing snapshot',
                error,
              ),
            )
          }
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
  SnapshotDataIntegrityError | SnapshotReadError | SnapshotAccessDeniedError
> => {
  const key = buildSnapshotKey({
    formId,
    submissionId,
    submissionIndex,
    token,
  })

  return ResultAsync.fromPromise(
    AwsConfig.s3.send(
      new GetObjectCommand({
        Bucket: AwsConfig.submissionHistoryV4S3Bucket,
        Key: key,
      }),
    ),
    (error) => error,
  )
    .andThen((data) => {
      if (data.Body === undefined) {
        return errAsync(
          new SnapshotDataIntegrityError('Submission snapshot body is empty'),
        )
      }
      return ResultAsync.fromPromise(
        data.Body.transformToString(),
        (error) => error,
      ).andThen(parseSnapshot)
    })
    .orElse((error) => {
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
      if (isAccessDenied(error)) {
        logger.error({
          message: 'Snapshot read was denied by the store',
          meta: { action: 'readV4Snapshot', key },
          error: error as Error,
        })
        return errAsync(new SnapshotAccessDeniedError(undefined, error))
      }
      logger.error({
        message: 'Snapshot read failed',
        meta: { action: 'readV4Snapshot', key },
        error: error as Error,
      })
      return errAsync(new SnapshotReadError(undefined, error))
    })
}
