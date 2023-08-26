// Unit tests for s3.service

import { CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Logger } from 'pino'

import { S3Service } from '../s3.service'

// Mock S3Client
let getResult = {
  Body: 'mockBody',
  VersionId: 'mockObjectVersionId',
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
      return
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
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
} as unknown as Logger

describe('S3Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('moveS3File', () => {
    it('should move file to clean bucket', async () => {
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

    it('should throw error if body is empty', async () => {
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
    })

    it('should throw error if version id is empty', async () => {
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
    })
  })

  describe('deleteS3File', () => {
    it('should delete file', async () => {
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
    })
  })
})
