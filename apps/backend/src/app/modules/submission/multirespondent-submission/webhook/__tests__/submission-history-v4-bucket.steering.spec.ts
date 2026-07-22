// @steering-gate: delete after S4 verified & merged
//
// Live smoke test for the SUBMISSION_HISTORY_V4_S3_BUCKET wiring: against a
// running Localstack (docker-compose + init-localstack.sh creates the bucket),
// PUT then GET a small object in the configured bucket and assert it round-trips.
// Skips gracefully when Localstack is unreachable (e.g. unit-test CI without the
// docker stack), so it is a no-op there rather than a failure.
import { aws as AwsConfig } from 'src/app/config/config'

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

describe('[STEERING] localstack bucket smoke: SUBMISSION_HISTORY_V4_S3_BUCKET', () => {
  it('PUTs then GETs a test object in the bucket (skips if Localstack is unreachable)', async () => {
    const Bucket = AwsConfig.submissionHistoryV4S3Bucket
    const Key = `__steering-smoke__/${Date.now()}.json`
    const Body = JSON.stringify({ smoke: true })

    try {
      await AwsConfig.s3
        .putObject({ Bucket, Key, Body, ContentType: 'application/json' })
        .promise()
      const got = await AwsConfig.s3.getObject({ Bucket, Key }).promise()
      expect(got.Body?.toString()).toBe(Body)
      // Cleanup the smoke object; ignore failure.
      await AwsConfig.s3
        .deleteObject({ Bucket, Key })
        .promise()
        .catch(() => undefined)
    } catch (err) {
      if (isUnreachable(err)) {
        // eslint-disable-next-line no-console
        console.warn(
          '[STEERING] Localstack unreachable — skipping V4 bucket smoke test.',
        )
        return
      }
      throw err
    }
  }, 20000)
})
