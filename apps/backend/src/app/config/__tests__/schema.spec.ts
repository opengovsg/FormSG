import convict from 'convict'

import { loadS3BucketUrlSchema } from '../schema'

const loadValidBucketUrls = ({
  endpoint,
  submissionHistoryS3BucketUrl,
}: {
  endpoint: string
  submissionHistoryS3BucketUrl: string
}) => ({
  endPoint: endpoint,
  attachmentBucketUrl: `${endpoint}/attachment-bucket/`,
  submissionHistoryS3BucketUrl,
  logoBucketUrl: `${endpoint}/logo-bucket`,
  imageBucketUrl: `${endpoint}/image-bucket`,
  staticAssetsBucketUrl: `${endpoint}/static-assets-bucket`,
  guarddutyQuarantineS3BucketUrl: `${endpoint}/guardduty-quarantine-bucket`,
  paymentProofS3BucketUrl: `${endpoint}/payment-proof-bucket`,
})

describe('S3 bucket URL schema', () => {
  const originalAwsEndpoint = process.env.AWS_ENDPOINT

  afterEach(() => {
    process.env.AWS_ENDPOINT = originalAwsEndpoint
  })

  it('accepts submission history bucket URL for development endpoints', () => {
    // Convict field values with `env` are sourced from process.env at validation time.
    process.env.AWS_ENDPOINT = 'http://localhost:4566'

    const schema = loadS3BucketUrlSchema({
      isDev: true,
      region: 'ap-southeast-1',
    })
    const config = convict(schema).load(
      loadValidBucketUrls({
        endpoint: 'http://localhost:4566',
        submissionHistoryS3BucketUrl:
          'http://localhost:4566/local-submission-history-bucket',
      }),
    )

    expect(() => config.validate({ allowed: 'strict' })).not.toThrow()
  })

  it('accepts submission history bucket URL for production region endpoints', () => {
    process.env.AWS_ENDPOINT = 'https://s3.ap-southeast-1.amazonaws.com'

    const schema = loadS3BucketUrlSchema({
      isDev: false,
      region: 'ap-southeast-1',
    })
    const config = convict(schema).load(
      loadValidBucketUrls({
        endpoint: 'https://s3.ap-southeast-1.amazonaws.com',
        submissionHistoryS3BucketUrl:
          'https://s3.ap-southeast-1.amazonaws.com/submission-history-bucket',
      }),
    )

    expect(() => config.validate({ allowed: 'strict' })).not.toThrow()
  })

  it('rejects submission history bucket URL when production region is incorrect', () => {
    process.env.AWS_ENDPOINT = 'https://s3.ap-southeast-1.amazonaws.com'

    const schema = loadS3BucketUrlSchema({
      isDev: false,
      region: 'ap-southeast-1',
    })
    const config = convict(schema).load(
      loadValidBucketUrls({
        endpoint: 'https://s3.ap-southeast-1.amazonaws.com',
        submissionHistoryS3BucketUrl:
          'https://s3.us-east-1.amazonaws.com/submission-history-bucket',
      }),
    )

    expect(() => config.validate({ allowed: 'strict' })).toThrow(
      /region should be ap-southeast-1/i,
    )
  })
})
