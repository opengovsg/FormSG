import { S3EventRecord, S3Handler } from 'aws-lambda'
import pino from 'pino'

import { BackendService } from './backend.service'
import { scanFileStream } from './clamscan.service'
import { config } from './config'
import { getLambdaLogger } from './logger'
import { S3Service } from './s3.service'
import { decodeS3URI } from './utils'

const processS3Event = async (
  record: S3EventRecord,
  backendService: BackendService,
  logger: pino.Logger,
) => {
  const {
    bucket: { name: bucketName },
    object: { key: rawObjectKey },
  } = record.s3

  const objectKey = decodeS3URI(rawObjectKey)
  // object key prefix is of format {uin}/{document-name}
  const [uin] = objectKey.split('/')

  try {
    const s3Client = new S3Service(config.isTestOrDev, logger)

    const s3ReadableStream = await s3Client.getS3FileStream({
      bucketName,
      objectKey,
    })

    logger.info('scanning file for viruses!')

    const { isMalicious, virusMetadata } = await scanFileStream(
      s3ReadableStream,
    )

    await handleMaliciousResult(
      isMalicious,
      virusMetadata,
      uin,
      logger,
      s3Client,
      bucketName,
      backendService,
      objectKey,
    )

    logger.info({
      message: `scan results:`,
      isMalicious,
      virusMetadata,
      uin,
      objectKey,
      bucketName,
    })
  } catch (err) {
    logger.error(err)
  }
}

const handleMaliciousResult = async (
  isMalicious: boolean,
  virusMetadata: string[],
  uin: string,
  logger: pino.Logger,
  s3Client: S3Service,
  bucketName: string,
  backendService: BackendService,
  objectKey: string,
) => {
  if (isMalicious) {
    logger.error({
      message: 'malicious file detected!!',
      virusMetadata,
      bucketName,
      objectKey,
    })
  }

  await s3Client.updateIsMaliciousTag({
    bucketName,
    objectKey,
    isMaliciousTagValue: isMalicious ? 'true' : 'false',
  })

  // This is currently disabled in production/uat as we have not
  // solved the issue of VPC isolation + IP whitelisting when the
  // scanner call the backend service.
  if (config.isTestOrDev) {
    logger.info({
      message: 'calling backend to update malicious status...',
      isMalicious,
      objectKey,
    })

    await backendService.updateMaliciousStatus(
      isMalicious,
      uin,
      objectKey,
      virusMetadata,
    )

    logger.info({
      message: 'succeeded in calling backend to update status!',
      isMalicious,
      objectKey,
    })
  }
}

export const handler: S3Handler = async (event, context) => {
  const logger = getLambdaLogger('virus-scanner')
  const backendService = new BackendService(
    config.backend.url,
    config.backend.apiKey,
  )

  logger.setContext(context)

  await Promise.all(
    event.Records.map(async (record) => {
      await processS3Event(record, backendService, logger)
    }),
  )
}
