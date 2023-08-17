import { APIGatewayProxyResult } from 'aws-lambda'
import crypto from 'crypto'

import { scanFileStream } from './clamscan.service'
import { config } from './config'
import { getLambdaLogger } from './logger'
import { S3Service } from './s3.service'
import { isBodyWithKey } from './types'

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
      statusCode: 400,
      body: JSON.stringify({
        message: 'Missing key in body',
      }),
    }
  }

  const quarantineFileKey = event.key

  const cleanBucket = config.virusScannerCleanS3Bucket
  const quarantineBucket = config.virusScannerQuarantineS3Bucket

  // Retrieve from S3
  const s3Client = new S3Service(config.isTestOrDev, logger)

  const s3ReadableStream = await s3Client.getS3FileStream({
    bucketName: quarantineBucket,
    objectKey: quarantineFileKey,
  })

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
      statusCode: 400,
      body: JSON.stringify({
        message: 'Malicious file detected',
        fileKey: quarantineFileKey,
      }),
    }
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
      statusCode: 200,
      body: JSON.stringify({
        message: 'File scan completed',
        cleanFileKey,
      }),
    }
  }
}
