// Live round-trip test for the snapshot store against a running Localstack
// (docker-compose + init-localstack.sh creates the bucket).
//
// D10 removed the S3 read-back from the initial send, which also removed the
// end-to-end coverage that path gave incidentally: before, every snapshot-backed
// send proved that what `writeV4Snapshot` PUT could be fetched and parsed again.
// The retry path (S5) still depends on exactly that round trip, so it is
// asserted here explicitly instead of as a side effect of sending.
//
// Skips gracefully when Localstack is unreachable (e.g. unit-test CI without the
// docker stack), so it is a no-op there rather than a failure.
import { aws as AwsConfig } from 'src/app/config/config'

import { buildV4Snapshot } from '../submission-snapshot.producer'
import { parseSnapshot } from '../submission-snapshot.schema'
import {
  buildSnapshotKey,
  readV4Snapshot,
  writeV4Snapshot,
} from '../submission-snapshot.store'

const REACHABILITY_ERRORS = [
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'UnknownEndpoint',
  'TimeoutError',
  'NetworkingError',
]

const isUnreachable = (err: unknown): boolean => {
  const code = (err as { code?: string })?.code ?? ''
  const name = (err as { name?: string })?.name ?? ''
  return (
    REACHABILITY_ERRORS.includes(code) || REACHABILITY_ERRORS.includes(name)
  )
}

/**
 * True when Localstack answers at all. Probed with a raw GET for a key that
 * cannot exist: a NoSuchKey response proves the endpoint is live.
 */
const isLocalstackReachable = async (): Promise<boolean> => {
  try {
    await AwsConfig.s3
      .getObject({
        Bucket: AwsConfig.submissionHistoryV4S3Bucket,
        Key: `__reachability-probe__/${Date.now()}`,
      })
      .promise()
    return true
  } catch (err) {
    if (isUnreachable(err)) return false
    return true
  }
}

describe('submission snapshot S3 round trip (Localstack)', () => {
  const coords = {
    formId: `roundtrip-form-${Date.now()}`,
    submissionId: 'roundtrip-submission',
    submissionIndex: 3,
  }

  const snapshot = buildV4Snapshot({
    ...coords,
    workflowStep: 2,
    encryptedContent: 'encrypted-content-blob',
    encryptedSubmissionSecretKey: 'wrapped-read-key',
    verifiedContent: 'verified-content-blob',
    attachmentMetadata: { 'field-1': 'form-1/attachment-1' },
    createdAt: '2026-07-22T00:00:00.000Z',
  })

  it('writes a snapshot, reads it back and parses it through the shared parser', async () => {
    if (!(await isLocalstackReachable())) {
      // eslint-disable-next-line no-console
      console.warn('Localstack unreachable — skipping snapshot round trip.')
      return
    }

    const written = await writeV4Snapshot(snapshot)
    expect(written.isOk()).toBe(true)
    const { token, key } = written._unsafeUnwrap()
    expect(key).toBe(buildSnapshotKey({ ...coords, token }))

    // The reader parses through the shared fail-loud parser, so an object that
    // survives this is one the retry path can actually deliver.
    const read = await readV4Snapshot({ ...coords, token })
    expect(read.isOk()).toBe(true)
    expect(read._unsafeUnwrap()).toEqual(snapshot)

    // And the raw bytes on the object are exactly what the parser accepts —
    // asserted independently of the reader so a change in either is caught.
    const raw = await AwsConfig.s3
      .getObject({ Bucket: AwsConfig.submissionHistoryV4S3Bucket, Key: key })
      .promise()
    const parsed = parseSnapshot(raw.Body?.toString() ?? '')
    expect(parsed.isOk()).toBe(true)
    expect(parsed._unsafeUnwrap()).toEqual(snapshot)

    await AwsConfig.s3
      .deleteObject({ Bucket: AwsConfig.submissionHistoryV4S3Bucket, Key: key })
      .promise()
      .catch(() => undefined)
  }, 20000)
})
