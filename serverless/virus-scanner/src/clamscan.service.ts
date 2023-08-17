import NodeClam from 'clamscan'
import internal, { Stream } from 'stream'

type ScanFileStreamResult = {
  isMalicious: boolean
  virusMetadata: string[]
  // cleanFile only if isMalicious is false
  cleanFile?: Buffer
}

export async function scanFileStream(
  s3Stream: internal.Readable,
): Promise<ScanFileStreamResult> {
  const scanner = await new NodeClam().init({
    clamdscan: {
      socket: '/tmp/clamd.ctl',
    },
  })

  const { isInfected: isMalicious, viruses: virusMetadata } =
    await scanner.scanStream(s3Stream)

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
        resolve({
          isMalicious,
          virusMetadata,
          // Include cleanFile only if isMalicious is false
          ...(!isMalicious
            ? {}
            : { cleanFile: Buffer.concat(outputBufferArr) }),
        })
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}
