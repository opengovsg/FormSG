// Unit tests for s3.service

import { CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

import * as LoggerService from '../logger'
import { S3Service } from '../s3.service'

const VersionId = 'mockObjectVersionId'
// Mock S3Client
let getResult = {
  Body: 'mockBody',
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
    GetObjectCommand: jest.fn().mockImplementation(() => {
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
  describe('getS3FileStreamWithVersionId', () => {
    it('should return file stream with version id', async () => {
      // Arrange
      const mockS3Service = new S3Service(true, mockLogger)

      // Act
      const result = await mockS3Service.getS3FileStreamWithVersionId({
        bucketName: 'bucketName',
        objectKey: 'objectKey',
      })

      // Assert
      expect(result).toEqual({
        body: 'mockBody',
        versionId: 'mockObjectVersionId',
      })
    })

    it('should throw error and log if body is empty', async () => {
      // Arrange
      const mockS3Service = new S3Service(true, mockLogger)
      getResult = {
        Body: '',
        VersionId: 'mockObjectVersionId',
      }

      // Act + assert
      await expect(
        mockS3Service.getS3FileStreamWithVersionId({
          bucketName: 'bucketName',
          objectKey: 'objectKey',
        }),
      ).rejects.toThrow('Body is empty')

      expect(mockLoggerError).toHaveBeenCalledTimes(1)
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.objectContaining({
          bucketName: 'bucketName',
          objectKey: 'objectKey',
          err: new Error('Body is empty'),
        }),
        'Failed to get object from s3',
      )
    })

    it('should throw error and log if version id is empty', async () => {
      // Arrange
      const mockS3Service = new S3Service(true, mockLogger)
      getResult = {
        Body: 'mockBody',
        VersionId: '',
      }

      // Act + assert
      await expect(
        mockS3Service.getS3FileStreamWithVersionId({
          bucketName: 'bucketName',
          objectKey: 'objectKey',
        }),
      ).rejects.toThrow('VersionId is empty')

      expect(mockLoggerError).toHaveBeenCalledTimes(1)
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.objectContaining({
          bucketName: 'bucketName',
          objectKey: 'objectKey',
          err: new Error('VersionId is empty'),
        }),
        'Failed to get object from s3',
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
