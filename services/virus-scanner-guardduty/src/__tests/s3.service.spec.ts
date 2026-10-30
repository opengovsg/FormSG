// Unit tests for s3.service

import { CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

import * as LoggerService from '../logger'
import {
  MissingS3VersionIdError,
  S3Service,
  ZeroByteS3ObjectError,
} from '../s3.service'

const VersionId = 'mockObjectVersionId'
// Mock S3Client
let getResult = {
  ContentLength: 100,
  VersionId,
}
jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => {
      return {
        send: jest.fn().mockImplementation((result) => {
          return result
        }),
      }
    }),
    CopyObjectCommand: jest.fn().mockImplementation(() => {
      return { VersionId }
    }),
    DeleteObjectCommand: jest.fn().mockImplementation(() => {
      return
    }),
    HeadObjectCommand: jest.fn().mockImplementation(() => {
      return getResult
    }),
  }
})

// Mock logger
const MockLoggerService = jest.mocked(LoggerService)
const mockLoggerInfo = jest.fn()
const mockLoggerWarn = jest.fn()
const mockLoggerError = jest.fn()

MockLoggerService.getLambdaLogger = jest.fn().mockReturnValue({
  info: mockLoggerInfo,
  warn: mockLoggerWarn,
  error: mockLoggerError,
})
const mockLogger = MockLoggerService.getLambdaLogger('virus-scanner')

describe('S3Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('moveS3File', () => {
    it('should move file to clean bucket and log', async () => {
      // Arrange
      const mockS3Service = new S3Service(true, mockLogger)

      // Act
      await mockS3Service.moveS3File({
        sourceBucketName: 'sourceBucketName',
        sourceObjectKey: 'sourceObjectKey',
        sourceObjectVersionId: 'sourceObjectVersionId',
        destinationBucketName: 'destinationBucketName',
        destinationObjectKey: 'destinationObjectKey',
      })

      // Assert

      expect(CopyObjectCommand).toHaveBeenCalledTimes(1)
      expect(CopyObjectCommand).toHaveBeenCalledWith({
        Key: 'destinationObjectKey',
        Bucket: 'destinationBucketName',
        CopySource:
          'sourceBucketName/sourceObjectKey?versionId=sourceObjectVersionId',
      })

      expect(DeleteObjectCommand).toHaveBeenCalledTimes(1)
      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Key: 'sourceObjectKey',
        Bucket: 'sourceBucketName',
        VersionId: 'sourceObjectVersionId',
      })

      expect(mockLoggerInfo).toHaveBeenCalledTimes(2)
      expect(mockLoggerInfo).toHaveBeenNthCalledWith(
        1,
        {
          sourceBucketName: 'sourceBucketName',
          sourceObjectKey: 'sourceObjectKey',
          sourceObjectVersionId: 'sourceObjectVersionId',
          destinationBucketName: 'destinationBucketName',
          destinationObjectKey: 'destinationObjectKey',
        },
        'Moving document in s3',
      )
      expect(mockLoggerInfo).toHaveBeenNthCalledWith(
        2,
        {
          sourceBucketName: 'sourceBucketName',
          sourceObjectKey: 'sourceObjectKey',
          sourceObjectVersionId: 'sourceObjectVersionId',
          destinationBucketName: 'destinationBucketName',
          destinationObjectKey: 'destinationObjectKey',
          destinationVersionId: 'mockObjectVersionId',
        },
        'Moved document in s3',
      )
    })
  })
  describe('getS3ObjectVersionId', () => {
    beforeEach(() => {
      // The real retry backoff (2s/4s/8s/16s) would make these tests slow; fake
      // timers let the retry waits resolve instantly. We advance up to 40s,
      // which stays under the retry wrapper's 60s timeout.
      jest.useFakeTimers()
    })
    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return version id', async () => {
      // Arrange
      const mockS3Service = new S3Service(true, mockLogger)

      // Act
      const versionIdResult = await mockS3Service.getS3ObjectVersionId({
        bucketName: 'bucketName',
        objectKey: 'objectKey',
      })

      // Assert
      expect(versionIdResult).toEqual('mockObjectVersionId')
    })

    it('should short-circuit without retrying when the object is 0 bytes', async () => {
      // Arrange
      const mockS3Service = new S3Service(true, mockLogger)
      getResult = {
        ContentLength: 0,
        VersionId: 'mockObjectVersionId',
      }

      // Act + assert. A 0-byte HeadObject is non-retryable, so no retry waits
      // are scheduled and the promise settles immediately.
      await expect(
        mockS3Service.getS3ObjectVersionId({
          bucketName: 'bucketName',
          objectKey: 'objectKey',
        }),
      ).rejects.toThrow(ZeroByteS3ObjectError)

      // Only one attempt ran — proving the retry loop was short-circuited.
      expect(mockLoggerWarn).toHaveBeenCalledTimes(1)
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.objectContaining({
          meta: expect.objectContaining({ attempt: 1, status: 'missed' }),
          err: expect.any(ZeroByteS3ObjectError),
        }),
        'getS3ObjectVersionId attempt failed',
      )
      expect(mockLoggerError).toHaveBeenCalledTimes(1)
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.objectContaining({
          meta: expect.objectContaining({
            bucketName: 'bucketName',
            objectKey: 'objectKey',
            status: 'failed',
            attempts: 1,
          }),
          err: expect.any(ZeroByteS3ObjectError),
        }),
        'Failed to get object version ID from s3',
      )
    })

    it('should retry then fail when the version id is empty', async () => {
      // Arrange
      const mockS3Service = new S3Service(true, mockLogger)
      getResult = {
        ContentLength: 100,
        VersionId: '',
      }

      // Act + assert. missing-VersionId is still retried (unchanged), so we must
      // attach the rejection assertion before advancing fake timers, otherwise
      // the rejection fires unhandled while the retry waits are flushing.
      // eslint-disable-next-line jest/valid-expect -- assertion is awaited below
      const expectation = expect(
        mockS3Service.getS3ObjectVersionId({
          bucketName: 'bucketName',
          objectKey: 'objectKey',
        }),
      ).rejects.toThrow(MissingS3VersionIdError)
      await jest.advanceTimersByTimeAsync(40000)
      await expectation

      // 1 initial attempt + 3 retries = 4 attempts, all logged as missed.
      expect(mockLoggerWarn).toHaveBeenCalledTimes(4)
      expect(mockLoggerError).toHaveBeenCalledTimes(1)
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.objectContaining({
          meta: expect.objectContaining({
            bucketName: 'bucketName',
            objectKey: 'objectKey',
            status: 'failed',
            attempts: 4,
          }),
          err: expect.any(MissingS3VersionIdError),
        }),
        'Failed to get object version ID from s3',
      )
    })
  })

  describe('deleteS3File', () => {
    it('should delete file and log', async () => {
      // Arrange
      const mockS3Service = new S3Service(true, mockLogger)

      // Act
      await mockS3Service.deleteS3File({
        bucketName: 'bucketName',
        objectKey: 'objectKey',
        versionId: 'versionId',
      })

      // Assert
      expect(DeleteObjectCommand).toHaveBeenCalledTimes(1)
      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Key: 'objectKey',
        Bucket: 'bucketName',
        VersionId: 'versionId',
      })
      expect(mockLoggerInfo).toHaveBeenCalledTimes(2)
      expect(mockLoggerInfo).toHaveBeenNthCalledWith(
        1,
        {
          bucketName: 'bucketName',
          objectKey: 'objectKey',
          versionId: 'versionId',
        },
        'Deleting document from s3',
      )
      expect(mockLoggerInfo).toHaveBeenNthCalledWith(
        2,
        {
          bucketName: 'bucketName',
          objectKey: 'objectKey',
        },
        'Deleted document from s3',
      )
    })
  })
})
