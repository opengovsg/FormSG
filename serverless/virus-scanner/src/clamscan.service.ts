import NodeClam from 'clamscan'
import internal from 'stream'

import { getLambdaLogger } from './logger'
import { ScanFileStreamResult } from './types'

const MAX_RETRIES = 3
const RETRY_INTERVAL_MS = 1000

const retryFunction = <T>(
  func: () => Promise<T>,
  retries: number,
  interval: number,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      func()
        .then(resolve)
        .catch((error) => {
          if (retries === 0) {
            reject(error)
          } else {
            setTimeout(() => {
              retries--
              attempt()
            }, interval)
          }
        })
    }
    attempt()
  })
}

export async function scanFileStream(
  s3Stream: internal.Readable,
): Promise<ScanFileStreamResult> {
  const logger = getLambdaLogger('scanFileStream')

  logger.info('Scanning file stream')

  const scanner = await retryFunction<NodeClam>(
    () => new NodeClam().init({ clamdscan: { socket: '/tmp/clamd.ctl' } }),
    MAX_RETRIES,
    RETRY_INTERVAL_MS,
  )

  const { isInfected: isMalicious, viruses: virusMetadata } =
    await scanner.scanStream(s3Stream)

  return isMalicious
    ? {
        isMalicious,
        virusMetadata,
      }
    : { isMalicious }
}
