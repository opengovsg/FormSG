import {
  GetObjectCommand,
  PutObjectTaggingCommand,
  PutObjectTaggingCommandInput,
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

  async updateIsMaliciousTag({
    bucketName,
    objectKey,
    isMaliciousTagValue,
  }: {
    bucketName: string
    objectKey: string
    isMaliciousTagValue: string
  }) {
    const input: PutObjectTaggingCommandInput = {
      Bucket: bucketName,
      Key: objectKey,
      Tagging: { TagSet: [{ Key: 'isMalicious', Value: isMaliciousTagValue }] },
    }
    this.logger.info(
      {
        objectKey,
        bucketName,
        isMaliciousTagValue,
      },
      'updating isMalicious tag',
    )

    try {
      await this.s3Client.send(new PutObjectTaggingCommand(input))
      this.logger.info(
        {
          objectKey,
          bucketName,
          isMaliciousTagValue,
        },
        'updated tag to object',
      )
    } catch (error) {
      this.logger.error(
        {
          objectKey,
          bucketName,
          isMaliciousTagValue,
        },
        'error updating tag to object',
      )
      throw error
    }
  }
}
