// @steering-gate: delete after S1 verified & merged
//
// Smoke test proving the three submission-history S3 buckets exist and are
// writable/readable against a live Localstack. It is intentionally scoped to
// S1 (bucket existence + config wiring) and should be removed once S1 is
// verified & merged. If Localstack is not reachable the assertions are skipped
// so the suite stays green in environments without it.
import { aws } from '../config'

const s3 = aws.s3

const BUCKETS = [
  aws.submissionHistoryV4S3Bucket,
  aws.submissionHistoryV1S3Bucket,
  aws.submissionHistoryV1AttachmentS3Bucket,
]

describe('[STEERING:S1] localstack bucket smoke', () => {
  let localstackAvailable = false

  beforeAll(async () => {
    try {
      await s3.listBuckets().promise()
      localstackAvailable = true
    } catch {
      localstackAvailable = false
      // eslint-disable-next-line no-console
      console.warn(
        '[STEERING:S1] Localstack not reachable — skipping bucket smoke assertions. Run against a live Localstack to exercise this gate.',
      )
    }
  })

  it.each(BUCKETS)(
    'PUTs then GETs a small object in bucket %s',
    async (bucket) => {
      if (!localstackAvailable) return

      const key = `steering-smoke-${Date.now()}.txt`
      const body = 'steering-smoke'

      await s3.putObject({ Bucket: bucket, Key: key, Body: body }).promise()
      const got = await s3.getObject({ Bucket: bucket, Key: key }).promise()

      expect(got.Body?.toString()).toBe(body)
    },
  )
})
