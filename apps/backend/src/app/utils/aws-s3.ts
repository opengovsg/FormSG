import {
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3'
import { createPresignedPost, PresignedPost } from '@aws-sdk/s3-presigned-post'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'
import { ResultAsync } from 'neverthrow'

import { aws as AwsConfig } from '../config/config'
import { createLoggerWithLabel } from '../config/logger'
import { ApplicationError } from '../modules/core/core.errors'

const logger = createLoggerWithLabel(module)

export class CreatePresignedPostError extends ApplicationError {
  constructor(
    message = 'Could not create presigned post data. Please try again.',
  ) {
    super(message)
  }
}

type CreatePresignedPostDataParams = {
  bucketName: string
  expiresSeconds: number
  size: number
  key?: string
  fileMd5Hash?: string
  fileType?: string
  acl?: string
}

export const s3Operations = {
  getObject: (params: GetObjectCommandInput) =>
    AwsConfig.s3.send(new GetObjectCommand(params)),
  putObject: (params: PutObjectCommandInput) =>
    AwsConfig.s3.send(new PutObjectCommand(params)),
  getSignedUrl: (params: GetObjectCommandInput, expiresIn: number) =>
    getSignedUrl(AwsConfig.s3, new GetObjectCommand(params), {
      expiresIn,
    }),
  createPresignedPost: (params: Parameters<typeof createPresignedPost>[1]) =>
    createPresignedPost(AwsConfig.s3, params),
}

export const getS3Object = (params: GetObjectCommandInput) =>
  s3Operations.getObject(params)

export const putS3Object = (params: PutObjectCommandInput) =>
  s3Operations.putObject(params)

export const getSignedS3Url = (
  params: GetObjectCommandInput,
  expiresIn: number,
) => s3Operations.getSignedUrl(params, expiresIn)

export const createPresignedPostDataPromise = (
  params: CreatePresignedPostDataParams,
): ResultAsync<PresignedPost, CreatePresignedPostError> => {
  const key = params.key ?? crypto.randomUUID()

  return ResultAsync.fromPromise(
    s3Operations.createPresignedPost({
      Bucket: params.bucketName,
      Key: key,
      Expires: params.expiresSeconds,
      Conditions: [
        // Content length restrictions: 1 byte to MAX_UPLOAD_FILE_SIZE.
        // Minimum is 1 (not 0) so S3 rejects empty uploads at the edge
        // with EntityTooSmall, keeping 0-byte objects out of quarantine.
        ['content-length-range', 1, params.size],
      ],
      Fields: {
        ...(params.acl ? { acl: params.acl } : undefined),
        ...(params.fileMd5Hash
          ? { 'Content-MD5': params.fileMd5Hash }
          : undefined),
        ...(params.fileType ? { 'Content-Type': params.fileType } : undefined),
      },
    }),
    (error) => {
      logger.error({
        message: 'Error encountered when creating presigned POST data',
        meta: {
          action: 'createPresignedPostDataPromise',
        },
        error,
      })

      return new CreatePresignedPostError()
    },
  )
}
