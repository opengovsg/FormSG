import mongoose from 'mongoose'
import { err, ok, Result } from 'neverthrow'
import { Transform } from 'stream'

import { aws as AwsConfig } from '../../../../config/config'
import { SubmissionCursorData } from '../../../../types'
import { getEncryptSubmissionModel } from '../../../models/submission.server.model'
import { isMalformedDate } from '../../../utils/date'
import { MalformedParametersError } from '../../core/core.errors'

const EncryptSubmissionModel = getEncryptSubmissionModel(mongoose)

/**
 * Returns a cursor to the stream of the submissions of the given form id.
 *
 * @param formId the id of the form to stream responses for
 * @param dateRange optional. The date range to limit responses to
 *
 * @returns ok(stream cursor) if created successfully
 * @returns err(MalformedParametersError) if given dates are invalid dates
 */
export const getSubmissionCursor = (
  formId: string,
  dateRange: {
    startDate?: string
    endDate?: string
  } = {},
): Result<
  ReturnType<typeof EncryptSubmissionModel.getSubmissionCursorByFormId>,
  MalformedParametersError
> => {
  if (
    isMalformedDate(dateRange.startDate) ||
    isMalformedDate(dateRange.endDate)
  ) {
    return err(new MalformedParametersError('Malformed date parameter'))
  }

  return ok(
    EncryptSubmissionModel.getSubmissionCursorByFormId(formId, dateRange),
  )
}

/**
 * Returns a Transform pipeline that transforms all attachment metadata of each
 * data chunk from the object path to the S3 signed URL so it can be retrieved
 * by the client.
 * @param enabled whether to perform any transformation
 * @param urlValidDuration how long to keep the S3 signed URL valid for
 * @returns a Transform pipeline to perform transformations on the pipe
 */
export const transformAttachmentMetaStream = ({
  enabled,
  urlValidDuration,
}: {
  enabled: boolean
  urlValidDuration: number
}): Transform => {
  return new Transform({
    objectMode: true,
    transform: (data: SubmissionCursorData, _encoding, callback) => {
      const totalCount = Object.keys(data.attachmentMetadata).length
      // Early return if pipe is disabled or nothing to transform.
      if (!enabled || totalCount === 0) {
        data.attachmentMetadata = {}
        return callback(null, data)
      }

      const unprocessedMetadata = data.attachmentMetadata
      data.attachmentMetadata = {}
      let processedCount = 0

      Object.entries(unprocessedMetadata).forEach(([key, objectPath]) => {
        AwsConfig.s3.getSignedUrl(
          'getObject',
          {
            Bucket: AwsConfig.attachmentS3Bucket,
            Key: objectPath,
            Expires: urlValidDuration,
          },
          (err, url) => {
            if (err) {
              return callback(err)
            }

            data.attachmentMetadata[key] = url
            processedCount += 1

            // Complete transformation.
            if (processedCount === totalCount) {
              return callback(null, data)
            }
          },
        )
      })
    },
  })
}
