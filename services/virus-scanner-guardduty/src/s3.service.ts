import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectTaggingCommand,
  HeadObjectCommand,
  S3Client,
  Tag,
} from '@aws-sdk/client-s3'
import pino from 'pino'
import { retry } from 'ts-retry-promise'

import { config } from './config'
import {
  DeleteS3FileParams,
  GetS3FileStreamParams,
  GUARD_DUTY_MALWARE_SCAN_TAG,
  MoveS3FileParams,
} from './types'

/**
 * ts-retry-promise wraps retried errors in its own RetryError, which exposes the
 * original failure as `lastError`. We duck-type it (instead of `instanceof`)
 * because the package's source/dist dual entry points make `instanceof` unsafe
 * under ts-jest.
 */
const isRetryError = (err: unknown): err is { lastError: unknown } =>
  !!err && typeof err === 'object' && 'lastError' in err

/**
 * Thrown when a HeadObject succeeds but the object has no VersionId.
 * Retried like any other transient failure, then surfaced to the caller.
 */
export class MissingS3VersionIdError extends Error {
  constructor() {
    super('VersionId is empty')
    this.name = 'MissingS3VersionIdError'
    Object.setPrototypeOf(this, MissingS3VersionIdError.prototype)
  }
}

/**
 * Thrown when a HeadObject reports ContentLength === 0. S3 has had strong
 * read-after-write consistency since 2020, so a 0-byte HeadObject can never
 * recover on retry — this error is therefore non-retryable and short-circuits
 * immediately so callers can log and bail without wasted invocations.
 */
export class ZeroByteS3ObjectError extends Error {
  constructor() {
    super('S3 object is 0 bytes')
    this.name = 'ZeroByteS3ObjectError'
    Object.setPrototypeOf(this, ZeroByteS3ObjectError.prototype)
  }
}

export class S3Service {
  private readonly s3Client: S3Client
  private readonly isDevelopmentEnv: boolean

  constructor(
    isDevelopmentEnv: boolean,
    private readonly logger: pino.Logger,
  ) {
    this.isDevelopmentEnv = isDevelopmentEnv

    if (isDevelopmentEnv) {
      this.s3Client = new S3Client({
        region: 'ap-southeast-1',
        endpoint: `http://host.docker.internal:4566`,
        forcePathStyle: true,
        credentials: {
          accessKeyId: '',
          secretAccessKey: '',
        },
      })
    } else {
      // lambda function should automatically pick configs at runtime in non-dev envs
      this.s3Client = new S3Client({
        region: 'ap-southeast-1',
      })
    }
  }

  async deleteS3File({ bucketName, objectKey, versionId }: DeleteS3FileParams) {
    this.logger.info(
      {
        bucketName,
        objectKey,
        versionId,
      },
      'Deleting document from s3',
    )

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Key: objectKey,
          Bucket: bucketName,
          VersionId: versionId,
        }),
      )

      this.logger.info(
        {
          bucketName,
          objectKey,
        },
        'Deleted document from s3',
      )
    } catch (err) {
      this.logger.error(
        {
          bucketName,
          objectKey,
          err,
        },
        'Failed to delete object from s3',
      )

      throw err
    }
  }

  async moveS3File({
    sourceBucketName,
    sourceObjectKey,
    sourceObjectVersionId,
    destinationBucketName,
    destinationObjectKey,
  }: MoveS3FileParams): Promise<string> {
    this.logger.info(
      {
        sourceBucketName,
        sourceObjectKey,
        sourceObjectVersionId,
        destinationBucketName,
        destinationObjectKey,
      },
      'Moving document in s3',
    )

    try {
      const { VersionId } = await this.s3Client.send(
        new CopyObjectCommand({
          Key: destinationObjectKey,
          Bucket: destinationBucketName,
          CopySource: `${sourceBucketName}/${sourceObjectKey}?versionId=${sourceObjectVersionId}`,
        }),
      )

      if (!VersionId) {
        this.logger.error(
          {
            sourceBucketName,
            sourceObjectKey,
            sourceObjectVersionId,
            destinationBucketName,
            destinationObjectKey,
          },
          'VersionId is empty after copying object in s3',
        )

        throw new Error('VersionId is empty')
      }

      await this.s3Client.send(
        new DeleteObjectCommand({
          Key: sourceObjectKey,
          Bucket: sourceBucketName,
          VersionId: sourceObjectVersionId,
        }),
      )

      this.logger.info(
        {
          sourceBucketName,
          sourceObjectKey,
          sourceObjectVersionId,
          destinationBucketName,
          destinationObjectKey,
          destinationVersionId: VersionId,
        },
        'Moved document in s3',
      )

      return VersionId
    } catch (err) {
      this.logger.error(
        {
          sourceBucketName,
          sourceObjectKey,
          sourceObjectVersionId,
          destinationBucketName,
          destinationObjectKey,
          err,
        },
        'Failed to move object in s3',
      )

      throw err
    }
  }

  async getS3ObjectScanTag({
    bucketName,
    objectKey,
  }: GetS3FileStreamParams): Promise<Tag> {
    this.logger.info('Checking for Malware Scan tag...', {
      bucketName,
      objectKey,
    })

    // Dev mode doesn't have GuardDuty scanning so, manually tag files as clean
    if (this.isDevelopmentEnv) {
      this.logger.info(
        'Development environment detected, skipping GuardDuty scan',
        {
          bucketName,
          objectKey,
        },
      )
      return {
        Key: GUARD_DUTY_MALWARE_SCAN_TAG,
        Value: 'NO_THREATS_FOUND',
      }
    }

    try {
      const malwareScanTag = await retry(
        async () => {
          const { TagSet: tagSet } = await this.s3Client.send(
            new GetObjectTaggingCommand({ Bucket: bucketName, Key: objectKey }),
          )

          const malwareScanningTag = tagSet?.find(
            (t) => t.Key === GUARD_DUTY_MALWARE_SCAN_TAG,
          )

          if (!malwareScanningTag) {
            this.logger.info('No Malware Scan tag found', {
              bucketName,
              objectKey,
            })
            throw Error('No Malware Scan tag found')
          }
          return malwareScanningTag
        },
        {
          retries: 'INFINITELY',
          timeout: config.guarddutyScanCheckTimeout,
          delay: config.guarddutyScanCheckDelay,
          backoff: 'LINEAR',
          maxBackOff: config.guarddutyScanCheckMaxBackoff,
        },
      )

      // return tag once found
      this.logger.info(
        `GuardDuty scan complete. Tags found for ${bucketName}/${objectKey}: ${malwareScanTag.Value}`,
      )
      return malwareScanTag
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('Timeout')) {
        this.logger.info('GuardDuty Malware Scan polling timed out', {
          bucketName,
          objectKey,
        })
        throw e
      } else {
        this.logger.error('Retry for retrieving malware scan tag failed', {
          bucketName,
          objectKey,
        })
        throw e
      }
    }
  }

  /**
   * Gets the version ID metadata without loading file content into lambda memory.
   * RATIONALE: This aims to reduce the memory usage and hence reduce the memory requirement for the lambda function, saving monetary cost.
   * In the event that the object is empty, an error is thrown.
   * @param params GetS3FileStreamParams
   * @returns Promise<{ versionId: string }>
   */
  async getS3ObjectVersionId({
    bucketName,
    objectKey,
  }: GetS3FileStreamParams): Promise<string> {
    const logMeta = {
      action: 'getS3ObjectVersionId',
      bucketName,
      objectKey,
    }

    this.logger.info(
      {
        meta: {
          ...logMeta,
          status: 'started',
        },
      },
      'Getting object version ID from s3',
    )

    let attempt = 0
    const logMissedAttempt = (err: unknown) => {
      this.logger.warn(
        {
          meta: {
            ...logMeta,
            status: 'missed',
            attempt,
          },
          err,
        },
        'getS3ObjectVersionId attempt failed',
      )
    }

    try {
      // S3 may briefly return NotFound when strong consistency lags, so retry
      // with 2s/4s/8s exponential backoff plus jitter before giving up.
      return await retry(
        async () => {
          attempt++

          let response
          try {
            response = await this.s3Client.send(
              new HeadObjectCommand({
                Key: objectKey,
                Bucket: bucketName,
              }),
            )
          } catch (err) {
            logMissedAttempt(err)
            throw err
          }

          const { VersionId: versionId, ContentLength } = response

          if (!versionId) {
            const err = new MissingS3VersionIdError()
            logMissedAttempt(err)
            throw err
          }

          if (!ContentLength || ContentLength === 0) {
            const err = new ZeroByteS3ObjectError()
            logMissedAttempt(err)
            throw err
          }

          this.logger.info(
            {
              meta: {
                ...logMeta,
                status: 'success',
                attempt,
                versionId,
                contentLength: ContentLength,
              },
            },
            'Retrieved object version ID from s3',
          )

          return versionId
        },
        {
          retries: 3,
          delay: 2000,
          backoff: (attempt) =>
            1000 * Math.pow(2, attempt) + Math.floor(Math.random() * 1000),
          // A 0-byte HeadObject can never recover under S3 strong
          // read-after-write consistency, so do not retry it. 404 and
          // missing-VersionId still retry as before.
          retryIf: (err) => !(err instanceof ZeroByteS3ObjectError),
        },
      )
    } catch (err) {
      // ts-retry-promise wraps retried errors in its RetryError (exposed via
      // `lastError`); unwrap to the original cause so callers can branch on the
      // typed error. The 0-byte case is never retried (see retryIf above) and
      // surfaces unwrapped.
      const cause = isRetryError(err) ? err.lastError : err
      this.logger.error(
        {
          meta: {
            ...logMeta,
            status: 'failed',
            attempts: attempt,
          },
          err: cause,
        },
        'Failed to get object version ID from s3',
      )

      throw cause
    }
  }
}
