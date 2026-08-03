describe('config', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  describe('SUBMISSION_HISTORY_V4_S3_BUCKET', () => {
    it('should throw on boot when SUBMISSION_HISTORY_V4_S3_BUCKET is not set', () => {
      // Arrange
      delete process.env.SUBMISSION_HISTORY_V4_S3_BUCKET

      // Act + Assert
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      expect(() => require('../config')).toThrow()
    })

    it('should expose SUBMISSION_HISTORY_V4_S3_BUCKET as aws.submissionHistoryV4S3Bucket when set', () => {
      // Arrange
      process.env.SUBMISSION_HISTORY_V4_S3_BUCKET =
        'local-submission-history-v4-bucket'

      // Act
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const config = require('../config')

      // Assert
      expect(config.aws.submissionHistoryV4S3Bucket).toBe(
        process.env.SUBMISSION_HISTORY_V4_S3_BUCKET,
      )
    })
  })
})
