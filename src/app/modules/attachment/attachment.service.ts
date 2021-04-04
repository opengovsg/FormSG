import crypto from 'crypto'
import { ResultAsync } from 'neverthrow'

import { aws as AwsConfig } from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import { AttachmentUploadError } from '../core/core.errors'

const logger = createLoggerWithLabel(module)

export const uploadAttachments = (
  formId: string,
  attachmentData: Record<string, unknown>,
): ResultAsync<Map<string, string>, AttachmentUploadError> => {
  const attachmentMetadata = new Map()
  const attachmentUploadPromises = []

  for (const fieldId in attachmentData) {
    const individualAttachment = JSON.stringify(attachmentData[fieldId])

    const hashStr = crypto
      .createHash('sha256')
      .update(individualAttachment)
      .digest('hex')

    const uploadKey =
      formId + '/' + crypto.randomBytes(20).toString('hex') + '/' + hashStr

    attachmentMetadata.set(fieldId, uploadKey)
    attachmentUploadPromises.push(
      AwsConfig.s3
        .upload({
          Bucket: AwsConfig.attachmentS3Bucket,
          Key: uploadKey,
          Body: Buffer.from(individualAttachment),
        })
        .promise(),
    )
  }

  return ResultAsync.fromPromise(
    Promise.all(attachmentUploadPromises).then(() => attachmentMetadata),
    (error) => {
      logger.error({
        message: 'S3 attachment upload error',
        meta: { action: 'uploadAttachments' },
        error,
      })
      return new AttachmentUploadError()
    },
  )
}
