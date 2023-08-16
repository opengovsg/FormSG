import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import pino from 'pino'
import internal from 'stream'

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
  }: {
    bucketName: string
    objectKey: string
  }) {
    this.logger.info(
      {
        bucketName,
        objectKey,
      },
      'Getting document from s3',
    )

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

  async putS3FileStream({
    bucketName,
    objectKey,
    body,
  }: {
    bucketName: string
    objectKey: string
    body: internal.Readable
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
