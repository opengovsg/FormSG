import NodeClam from 'clamscan'
import internal from 'stream'

export async function scanFileStream(s3Stream: internal.Readable) {
  const scanner = await new NodeClam().init({
    clamdscan: {
      socket: '/tmp/clamd.ctl',
    },
  })

  const { isInfected: isMalicious, viruses: virusMetadata } =
    await scanner.scanStream(s3Stream)

  return { isMalicious, virusMetadata }
}
