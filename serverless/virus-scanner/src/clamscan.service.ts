import NodeClam from 'clamscan'
import internal, { Stream } from 'stream'

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

  logger.info('Finished scanning file stream', {
    isMalicious,
    virusMetadata,
  })

  // create a writable stream to memory
  const outputStream = new Stream.Writable()
  const outputBufferArr: Uint8Array[] = []
  outputStream._write = function (chunk) {
    outputBufferArr.push(chunk)
  }

  s3Stream.pipe(outputStream)

  return new Promise((resolve, reject) => {
    outputStream
      .on('finish', () => {
        logger.info('Finished piping file stream to output stream', {
          isMalicious,
          virusMetadata,
        })

        if (isMalicious === true) {
          resolve({
            isMalicious,
            virusMetadata,
          })
        } else {
          resolve({
            isMalicious,
            cleanFile: Buffer.concat(outputBufferArr),
          })
        }
      })
      .on('error', (err) => {
        logger.error('Error piping file stream to output stream', {
          isMalicious,
          virusMetadata,
          err,
        })
        reject(err)
      })
  })
}
