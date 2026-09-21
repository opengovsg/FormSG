/**
 * [STEERING:T3] — DELETE once the V1 content bucket is provisioned in a real
 * environment and verified there (#9754).
 *
 * The store's unit spec mocks the S3 client, so it proves the routing and not
 * that the bucket exists or that an object survives a round trip through it.
 * This does the round trip for real against Localstack, using the same
 * production code path and the same configured bucket name, and skips itself
 * when Localstack is not running — which it is not in CI.
 */
import { HeadBucketCommand } from '@aws-sdk/client-s3'
import { ObjectId } from 'bson'

import { aws as AwsConfig } from 'src/app/config/config'

import { buildV1Snapshot } from '../submission-snapshot.producer'
import { readSnapshot, writeSnapshot } from '../submission-snapshot.store'

const isLocalstackReachable = async (): Promise<boolean> => {
  try {
    await AwsConfig.s3.send(
      new HeadBucketCommand({ Bucket: AwsConfig.submissionHistoryV1S3Bucket }),
    )
    return true
  } catch {
    return false
  }
}

describe('[STEERING:T3] V1 content bucket smoke test', () => {
  let reachable = false

  beforeAll(async () => {
    reachable = await isLocalstackReachable()
    if (!reachable) {
      // eslint-disable-next-line no-console
      console.warn(
        `Skipping the V1 bucket smoke test: ${AwsConfig.submissionHistoryV1S3Bucket} is not reachable. Run \`docker-compose up localstack\` and \`./init-localstack.sh\` to exercise it.`,
      )
    }
  })

  it('should write a V1 snapshot to the V1 bucket and read it back byte-identically', async () => {
    if (!reachable) return

    // Arrange
    const snapshot = buildV1Snapshot({
      formId: new ObjectId().toHexString(),
      submissionId: new ObjectId().toHexString(),
      submissionIndex: 0,
      workflowStep: 0,
      encryptedContent: 'form-key-encrypted-content',
      verifiedContent: 'form-key-verified-content',
      attachmentMetadata: { 'field-1': 'object-key' },
      createdAt: new Date().toISOString(),
    })

    // Act
    const written = await writeSnapshot(snapshot)
    expect(written.isOk()).toBe(true)

    const read = await readSnapshot({
      formId: snapshot.formId,
      submissionId: snapshot.submissionId,
      submissionIndex: snapshot.submissionIndex,
      token: written._unsafeUnwrap().token,
      contentFormat: 'v1',
    })

    // Assert
    expect(read.isOk()).toBe(true)
    expect(read._unsafeUnwrap()).toEqual(snapshot)
  })

  it('should not find a V1 object in the V4 bucket', async () => {
    if (!reachable) return

    // The two stores are separate so the transitional data can be
    // decommissioned wholesale; a V1 object must not be in the other one.
    const snapshot = buildV1Snapshot({
      formId: new ObjectId().toHexString(),
      submissionId: new ObjectId().toHexString(),
      submissionIndex: 0,
      workflowStep: 0,
      encryptedContent: 'form-key-encrypted-content',
      createdAt: new Date().toISOString(),
    })
    const written = await writeSnapshot(snapshot)

    const readFromV4Bucket = await readSnapshot({
      formId: snapshot.formId,
      submissionId: snapshot.submissionId,
      submissionIndex: snapshot.submissionIndex,
      token: written._unsafeUnwrap().token,
      contentFormat: 'v4',
    })

    expect(readFromV4Bucket.isErr()).toBe(true)
  })
})
