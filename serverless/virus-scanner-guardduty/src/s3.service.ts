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

import {
  DeleteS3FileParams,
  GetS3FileStreamParams,
  GUARD_DUTY_MALWARE_SCAN_TAG,
  MoveS3FileParams,
} from './types'

export class S3Service {
  private readonly s3Client: S3Client

  constructor(
    isDevelopmentEnv: boolean,
    private readonly logger: pino.Logger,
  ) {
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
          timeout: 40 * 1000, // 40 seconds.
          delay: 200, // first delay - 0.2 seconds
          backoff: 'LINEAR',
          maxBackOff: 2 * 1000, // max increment in delay - 2 seconds
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
    this.logger.info(
      {
        bucketName,
        objectKey,
      },
      'Getting object version ID from s3',
    )

    try {
      const { VersionId: versionId, ContentLength } = await this.s3Client.send(
        new HeadObjectCommand({
          Key: objectKey,
          Bucket: bucketName,
        }),
      )

      if (!versionId) {
        throw new Error('VersionId is empty')
      }

      if (!ContentLength || ContentLength === 0) {
        throw new Error('Object is empty')
      }

      this.logger.info(
        {
          bucketName,
          objectKey,
          versionId,
          contentLength: ContentLength,
        },
        'Retrieved object version ID from s3',
      )

      return versionId
    } catch (err) {
      this.logger.error(
        {
          bucketName,
          objectKey,
          err,
        },
        'Failed to get object version ID from s3',
      )

      throw err
    }
  }
}
