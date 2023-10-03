import { APIGatewayProxyResult } from 'aws-lambda'
import crypto from 'crypto'
import { StatusCodes } from 'http-status-codes'
import { validate } from 'uuid'

import { scanFileStream } from './clamscan.service'
import { config } from './config'
import { getLambdaLogger } from './logger'
import { S3Service } from './s3.service'
import { isBodyWithKey } from './types'

/**
 * Handler for virus scanner lambda
 * To invoke handle locally, send POST request to http://localhost:9999/2015-03-31/functions/function/invocations with the following request body:
 * { "key": <object key>}
 * @param event
 * @returns 200 with clean file key if clean
 * @returns 400 if malicious
 * @returns 400 if body is missing key
 * @returns 404 if file not found
 */
export const handler = async (
  event: unknown,
): Promise<APIGatewayProxyResult> => {
  const logger = getLambdaLogger('virus-scanner')

  logger.info('handler triggered')

  if (!isBodyWithKey(event)) {
    logger.warn({
      message: 'Missing key in body',
      event,
    })
    return {
      statusCode: StatusCodes.BAD_REQUEST,
      body: JSON.stringify({
        message: 'Missing key in body',
      }),
    }
  }

  if (!validate(event.key)) {
    logger.warn({
      message: 'Invalid key',
      event,
    })
    return {
      statusCode: StatusCodes.BAD_REQUEST,
      body: JSON.stringify({
        message: 'Invalid key',
      }),
    }
  }

  const quarantineFileKey = event.key

  const cleanBucket = config.virusScannerCleanS3Bucket
  const quarantineBucket = config.virusScannerQuarantineS3Bucket

  // Retrieve from S3
  const s3Client = new S3Service(config.isTestOrDev, logger)

  let s3ReadableStream
  try {
    s3ReadableStream = await s3Client.getS3FileStreamWithVersionId({
      bucketName: quarantineBucket,
      objectKey: quarantineFileKey,
    })
  } catch (error) {
    logger.warn({
      message: 'File not found',
      error,
      quarantineFileKey,
    })
    return {
      statusCode: StatusCodes.NOT_FOUND,
      body: JSON.stringify({
        message: 'File not found',
        fileKey: quarantineFileKey,
      }),
    }
  }

  // Scan file

  const { body, versionId } = s3ReadableStream

  let scanResult
  try {
    scanResult = await scanFileStream(body)
  } catch (error) {
    logger.error({
      message: 'Failed to scan file',
      error,
      quarantineFileKey,
    })
    return {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({
        message: 'Failed to scan file',
        key: quarantineFileKey,
      }),
    }
  }

  const { isMalicious } = scanResult

  // If malicious, log and delete
  if (isMalicious) {
    const { virusMetadata } = scanResult

    logger.error({
      message: 'Malicious file detected',
      virusMetadata,
      key: quarantineFileKey,
    })

    // Delete from quarantine bucket
    try {
      await s3Client.deleteS3File({
        bucketName: quarantineBucket,
        objectKey: quarantineFileKey,
        versionId,
      })
    } catch (error) {
      // Log but do not halt execution as we still want to return 400 for malicious file
      logger.error({
        message: 'Failed to delete file from quarantine bucket',
        error,
        key: quarantineFileKey,
      })
    }

    return {
      statusCode: StatusCodes.BAD_REQUEST,
      body: JSON.stringify({
        message: 'Malicious file detected',
        key: quarantineFileKey,
        virusMetadata,
      }),
    }
    // If clean, move to clean bucket with randomised key and return
  } else {
    const cleanFileKey = crypto.randomUUID()
    logger.info({
      message: 'clean file detected',
      key: quarantineFileKey,
      versionId,
    })

    let destinationVersionId: string

    try {
      destinationVersionId = await s3Client.moveS3File({
        sourceBucketName: quarantineBucket,
        sourceObjectKey: quarantineFileKey,
        sourceObjectVersionId: versionId,
        destinationBucketName: cleanBucket,
        destinationObjectKey: cleanFileKey,
      })
    } catch (error) {
      logger.error({
        message: 'Failed to move file to clean bucket',
        error,
        bucket: quarantineBucket,
        key: quarantineFileKey,
      })
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({
          message: 'Failed to move file to clean bucket',
          key: quarantineFileKey,
        }),
      }
    }

    logger.info({
      message: 'clean file moved to clean bucket',
      cleanFileKey,
      destinationVersionId,
    })

    return {
      statusCode: StatusCodes.OK,
      body: JSON.stringify({
        message: 'File scan completed',
        cleanFileKey,
        destinationVersionId,
      }),
    }
  }
}
