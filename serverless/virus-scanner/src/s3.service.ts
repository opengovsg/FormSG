import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import pino from 'pino'
import internal from 'stream'

import { GetDeleteS3FileStreamParams } from './types'

export class S3Service {
  private readonly s3Client: S3Client

  constructor(isDevelopmentEnv: boolean, private readonly logger: pino.Logger) {
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

  async getS3FileStream({
    bucketName,
    objectKey,
  }: GetDeleteS3FileStreamParams) {
    this.logger.info(
      {
        bucketName,
        objectKey,
      },
      'Getting document from s3',
    )

    try {
      const { Body: body } = await this.s3Client.send(
        new GetObjectCommand({
          Key: objectKey,
          Bucket: bucketName,
        }),
      )

      this.logger.info(
        {
          bucketName,
          objectKey,
        },
        'Retrieved document from s3',
      )

      return body as internal.Readable
    } catch (error) {
      this.logger.error(
        {
          bucketName,
          objectKey,
          error,
        },
        'Failed to get object from s3',
      )

      throw error
    }
  }

  async deleteS3File({ bucketName, objectKey }: GetDeleteS3FileStreamParams) {
    this.logger.info(
      {
        bucketName,
        objectKey,
      },
      'Deleting document from s3',
    )

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Key: objectKey,
          Bucket: bucketName,
        }),
      )

      this.logger.info(
        {
          bucketName,
          objectKey,
        },
        'Deleted document from s3',
      )
    } catch (error) {
      this.logger.error(
        {
          bucketName,
          objectKey,
          error,
        },
        'Failed to delete object from s3',
      )

      throw error
    }
  }

  async putS3File({
    bucketName,
    objectKey,
    body,
  }: {
    bucketName: string
    objectKey: string
    body: Buffer
  }) {
    this.logger.info(
      {
        bucketName,
        objectKey,
      },
      'Putting document to s3',
    )

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Key: objectKey,
          Bucket: bucketName,
          Body: body,
        }),
      )

      this.logger.info(
        {
          bucketName,
          objectKey,
        },
        'Put document to s3',
      )
    } catch (error) {
      this.logger.error(
        {
          bucketName,
          objectKey,
          error,
        },
        'Failed to put object to s3',
      )

      throw error
    }
  }
}
