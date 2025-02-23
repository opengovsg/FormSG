// Unit tests for handler in index.ts

import { APIGatewayProxyEvent } from 'aws-lambda'
import crypto from 'crypto'
import { StatusCodes } from 'http-status-codes'
import { validate } from 'uuid'

import * as ClamScanService from '../clamscan.service'
import { handler } from '../index'
import * as LoggerService from '../logger'
import { S3Service } from '../s3.service'

// mocked S3Service
const MockS3Service = jest.mocked(S3Service)

// mocked scanFileStream
const MockClamScanService = jest.mocked(ClamScanService)

// mocked logger
const MockLoggerService = jest.mocked(LoggerService)

const mockLoggerInfo = jest.fn()
const mockLoggerWarn = jest.fn()
const mockLoggerError = jest.fn()

MockLoggerService.getLambdaLogger = jest.fn().mockReturnValue({
  info: mockLoggerInfo,
  warn: mockLoggerWarn,
  error: mockLoggerError,
})

describe('handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 and log if no key in body', async () => {
    // Arrange
    const mockEvent = {
      otherKey: 'otherValue',
    }

    // Act
    const result = await handler(mockEvent as unknown as APIGatewayProxyEvent)

    // Assert
    expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(result.body).toBe(JSON.stringify({ message: 'Missing key in body' }))
    expect(mockLoggerWarn).toHaveBeenCalledTimes(1)
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Missing key in body',
        event: mockEvent,
      }),
    )
  })

  it('should return 400 and log if key is invalid uuid', async () => {
    // Arrange
    const mockEvent = {
      key: 'non-uuid-key',
    }

    // Act
    const result = await handler(mockEvent as unknown as APIGatewayProxyEvent)

    // Assert
    expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(result.body).toBe(JSON.stringify({ message: 'Invalid key' }))
    expect(mockLoggerWarn).toHaveBeenCalledTimes(1)
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid key',
        event: mockEvent,
      }),
    )
  })
  it('should return 404 and log if file not found', async () => {
    // Arrange
    const mockUUID = crypto.randomUUID()
    const mockEvent = { key: mockUUID }

    // Mock rejection of getS3FileStreamWithVersionId
    MockS3Service.prototype.getS3FileStreamWithVersionId = jest
      .fn()
      .mockRejectedValueOnce(new Error('File not found'))

    // Act
    const result = await handler(mockEvent as unknown as APIGatewayProxyEvent)

    // Assert
    expect(result.statusCode).toBe(StatusCodes.NOT_FOUND)
    expect(result.body).toBe(
      JSON.stringify({ message: 'File not found', fileKey: mockUUID }),
    )
    expect(mockLoggerWarn).toHaveBeenCalledTimes(1)
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'File not found',
        err: new Error('File not found'),
        quarantineFileKey: mockUUID,
      }),
    )
  })

  it('should delete file and log and return 400 status with virus metadata if file is malicious', async () => {
    // Arrange
    const mockUUID = crypto.randomUUID()
    const mockEvent = { key: mockUUID }

    MockS3Service.prototype.getS3FileStreamWithVersionId = jest
      .fn()
      .mockResolvedValueOnce({ body: 'mockBody', versionId: 'mockVersionId' })

    MockS3Service.prototype.deleteS3File = jest.fn().mockResolvedValueOnce('ok')

    MockClamScanService.scanFileStream = jest.fn().mockResolvedValueOnce({
      isMalicious: true,
      virusMetadata: ['Eicar-Test-Signature'],
    })

    // Act
    const result = await handler(mockEvent as unknown as APIGatewayProxyEvent)

    // Assert
    expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(result.body).toBe(
      JSON.stringify({
        message: 'Malicious file detected',
        key: mockUUID,
        virusMetadata: ['Eicar-Test-Signature'],
      }),
    )
    expect(MockS3Service.prototype.deleteS3File).toHaveBeenCalledWith({
      bucketName: 'local-virus-scanner-quarantine-bucket',
      objectKey: mockUUID,
      versionId: 'mockVersionId',
    })
    expect(mockLoggerError).toHaveBeenCalledTimes(1)
    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Malicious file detected',
        virusMetadata: ['Eicar-Test-Signature'],
        key: mockUUID,
      }),
    )
  })

  it('should return 500 error and log if virus scanning fails to complete and not delete the quarantine file', async () => {
    // Arrange
    const mockUUID = crypto.randomUUID()
    const mockEvent = { key: mockUUID }

    MockS3Service.prototype.getS3FileStreamWithVersionId = jest
      .fn()
      .mockResolvedValueOnce({ body: 'mockBody', versionId: 'mockVersionId' })

    MockClamScanService.scanFileStream = jest
      .fn()
      .mockRejectedValueOnce(new Error('Failed to scan file'))

    // Act
    const result = await handler(mockEvent as unknown as APIGatewayProxyEvent)

    // Assert
    expect(result.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
    expect(result.body).toBe(
      JSON.stringify({
        message: 'Failed to scan file',
        key: mockUUID,
      }),
    )
    expect(MockS3Service.prototype.deleteS3File).not.toHaveBeenCalled()
    expect(mockLoggerError).toHaveBeenCalledTimes(1)
    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Failed to scan file',
        err: new Error('Failed to scan file'),
        quarantineFileKey: mockUUID,
      }),
    )
  })

  it('should move file to clean bucket and log and return 200 if file is not malicious', async () => {
    // Arrange
    const mockUUID = crypto.randomUUID()
    const mockEvent = { key: mockUUID }

    MockS3Service.prototype.getS3FileStreamWithVersionId = jest
      .fn()
      .mockResolvedValueOnce({ body: 'mockBody', versionId: 'mockVersionId' })

    MockS3Service.prototype.moveS3File = jest.fn().mockResolvedValueOnce('ok')

    MockClamScanService.scanFileStream = jest.fn().mockResolvedValueOnce({
      isMalicious: false,
    })

    // Act
    const result = await handler(mockEvent as unknown as APIGatewayProxyEvent)

    // Assert
    expect(result.statusCode).toBe(StatusCodes.OK)
    const bodyJson = JSON.parse(result.body)
    expect(bodyJson).toHaveProperty('message')
    expect(bodyJson.message).toBe('File scan completed')
    expect(bodyJson).toHaveProperty('cleanFileKey')
    expect(validate(bodyJson.cleanFileKey)).toBe(true)
    // Should not be same as quarantine file key
    expect(bodyJson.cleanFileKey).not.toBe(mockUUID)
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'clean file moved to clean bucket',
        cleanFileKey: bodyJson.cleanFileKey,
      }),
    )
  })

  it('should return 500 error and log if file is clean but moving file to clean bucket fails', async () => {
    // Arrange
    const mockUUID = crypto.randomUUID()
    const mockEvent = { key: mockUUID }

    MockS3Service.prototype.getS3FileStreamWithVersionId = jest
      .fn()
      .mockResolvedValueOnce({ body: 'mockBody', versionId: 'mockVersionId' })

    MockS3Service.prototype.moveS3File = jest
      .fn()
      .mockRejectedValueOnce(new Error('Failed to move file'))

    MockClamScanService.scanFileStream = jest.fn().mockResolvedValueOnce({
      isMalicious: false,
    })

    // Act
    const result = await handler(mockEvent as unknown as APIGatewayProxyEvent)

    // Assert
    expect(result.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
    expect(result.body).toBe(
      JSON.stringify({
        message: 'Failed to move file to clean bucket',
        key: mockUUID,
      }),
    )
    expect(mockLoggerError).toHaveBeenCalledTimes(1)
    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Failed to move file to clean bucket',
        err: new Error('Failed to move file'),
        bucket: 'local-virus-scanner-quarantine-bucket',
        key: mockUUID,
      }),
    )
  })
})
