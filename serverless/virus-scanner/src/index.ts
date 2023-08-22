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
    s3ReadableStream = await s3Client.getS3FileStream({
      bucketName: quarantineBucket,
      objectKey: quarantineFileKey,
    })
  } catch (error) {
    logger.error({
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

  const scanResult = await scanFileStream(s3ReadableStream)
  const { isMalicious } = scanResult

  // Move to clean bucket if clean
  if (isMalicious) {
    const { virusMetadata } = scanResult

    logger.error({
      message: 'malicious file detected!!',
      virusMetadata,
      quarantineFileKey,
    })
    return {
      statusCode: StatusCodes.BAD_REQUEST,
      body: JSON.stringify({
        message: 'Malicious file detected',
        fileKey: quarantineFileKey,
        virusMetadata,
      }),
    }
    // If clean, move to clean bucket with randomised key and return
  } else {
    const cleanFileKey = crypto.randomUUID()
    logger.info({
      message: 'clean file detected',
      cleanFileKey,
    })

    const { cleanFile } = scanResult

    await s3Client.putS3File({
      bucketName: cleanBucket,
      objectKey: cleanFileKey,
      body: cleanFile,
    })

    logger.info({
      message: 'returning key to client',
      cleanFileKey,
    })

    return {
      statusCode: StatusCodes.OK,
      body: JSON.stringify({
        message: 'File scan completed',
        cleanFileKey,
      }),
    }
  }
}
