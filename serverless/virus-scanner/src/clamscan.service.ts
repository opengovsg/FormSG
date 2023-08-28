import NodeClam from 'clamscan'
import internal from 'stream'

import { getLambdaLogger } from './logger'
import { ScanFileStreamResult } from './types'

export async function scanFileStream(
  s3Stream: internal.Readable,
): Promise<ScanFileStreamResult> {
  const logger = getLambdaLogger('scanFileStream')

  logger.info('Scanning file stream')

  const scanner = await new NodeClam().init({
    clamdscan: {
      socket: '/tmp/clamd.ctl',
    },
  })

  const { isInfected: isMalicious, viruses: virusMetadata } =
    await scanner.scanStream(s3Stream)

  return isMalicious
    ? {
        isMalicious,
        virusMetadata,
      }
    : { isMalicious }
}
