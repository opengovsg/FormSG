import { PresignedPost } from 'aws-sdk/clients/s3'
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

export const createPresignedPostDataPromise = (
  params: CreatePresignedPostDataParams,
) => {
  return ResultAsync.fromPromise(
    new Promise<PresignedPost>((resolve, reject) => {
      AwsConfig.s3.createPresignedPost(
        {
          Bucket: params.bucketName,
          Expires: params.expiresSeconds,
          Conditions: [
            // Content length restrictions: 1 byte to MAX_UPLOAD_FILE_SIZE.
            // Minimum is 1 (not 0) so S3 rejects empty uploads at the edge
            // with EntityTooSmall, keeping 0-byte objects out of quarantine.
            ['content-length-range', 1, params.size],
          ],
          Fields: {
            key: params.key ?? crypto.randomUUID(),
            ...(params.acl ? { acl: params.acl } : undefined),
            ...(params.fileMd5Hash
              ? { 'Content-MD5': params.fileMd5Hash }
              : undefined),
            ...(params.fileType
              ? { 'Content-Type': params.fileType }
              : undefined),
          },
        },
        (err, data) => {
          if (err) {
            return reject(err)
          }
          return resolve(data)
        },
      )
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
