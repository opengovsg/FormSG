import { has } from 'lodash'
import internal from 'stream'

/**
 * Typeguard for checking if the event body has a key
 * @param body
serverless/virus-scanner/src/index.ts * @returns boolean
 */
type KeyBody = {
  key: string
}

export const isBodyWithKey = (body: unknown): body is KeyBody => {
  return (
    typeof body === 'object' &&
    !!body &&
    has(body, 'key') &&
    typeof (body as KeyBody).key === 'string'
  )
}

export type ScanFileStreamResult =
  | { isMalicious: true; virusMetadata: string[] }
  | { isMalicious: false }

export type GetS3FileStreamParams = {
  bucketName: string
  objectKey: string
}

export type DeleteS3FileParams = {
  bucketName: string
  objectKey: string
  versionId: string
}

export type GetS3FileStreamResult = {
  body: internal.Readable
  versionId: string
}

export type MoveS3FileParams = {
  sourceBucketName: string
  sourceObjectKey: string
  sourceObjectVersionId: string
  destinationBucketName: string
  destinationObjectKey: string
}
