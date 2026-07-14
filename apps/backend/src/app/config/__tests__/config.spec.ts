describe('config', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    // Shallow clone so mutations do not leak across tests.
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  describe('compulsory submission history bucket vars', () => {
    it('throws on boot if SUBMISSION_HISTORY_V4_S3_BUCKET is not set', () => {
      delete process.env.SUBMISSION_HISTORY_V4_S3_BUCKET

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      expect(() => require('../config')).toThrow()
    })

    it('throws on boot if SUBMISSION_HISTORY_V1_S3_BUCKET is not set', () => {
      delete process.env.SUBMISSION_HISTORY_V1_S3_BUCKET

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      expect(() => require('../config')).toThrow()
    })

    it('throws on boot if SUBMISSION_HISTORY_V1_ATTACHMENT_S3_BUCKET is not set', () => {
      delete process.env.SUBMISSION_HISTORY_V1_ATTACHMENT_S3_BUCKET

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      expect(() => require('../config')).toThrow()
    })

    it('surfaces the submission history bucket names on config.aws', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const config = require('../config')

      expect(config.aws.submissionHistoryV4S3Bucket).toBe(
        process.env.SUBMISSION_HISTORY_V4_S3_BUCKET,
      )
      expect(config.aws.submissionHistoryV1S3Bucket).toBe(
        process.env.SUBMISSION_HISTORY_V1_S3_BUCKET,
      )
      expect(config.aws.submissionHistoryV1AttachmentS3Bucket).toBe(
        process.env.SUBMISSION_HISTORY_V1_ATTACHMENT_S3_BUCKET,
      )
    })
  })
})
