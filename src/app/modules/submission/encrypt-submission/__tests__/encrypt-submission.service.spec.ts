/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ObjectId } from 'bson-ext'
import { clone } from 'lodash'
import mongoose from 'mongoose'
import { PassThrough, Transform } from 'stream'

import { getEncryptSubmissionModel } from 'src/app/models/submission.server.model'
import {
  DatabaseError,
  MalformedParametersError,
} from 'src/app/modules/core/core.errors'
import { CreatePresignedUrlError } from 'src/app/modules/form/admin-form/admin-form.errors'
import { aws } from 'src/config/config'
import {
  SubmissionCursorData,
  SubmissionData,
  SubmissionMetadata,
} from 'src/types'

import { SubmissionNotFoundError } from '../../submission.errors'
import {
  getEncryptedSubmissionData,
  getSubmissionCursor,
  getSubmissionMetadata,
  getSubmissionMetadataList,
  transformAttachmentMetasToSignedUrls,
  transformAttachmentMetaStream,
} from '../encrypt-submission.service'

const EncryptSubmission = getEncryptSubmissionModel(mongoose)

describe('encrypt-submission.service', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('getSubmissionCursor', () => {
    it('should return cursor successfully when date range is not provided', async () => {
      // Arrange
      const mockCursor = (jest.fn() as unknown) as mongoose.QueryCursor<any>
      const getSubmissionSpy = jest
        .spyOn(EncryptSubmission, 'getSubmissionCursorByFormId')
        .mockReturnValueOnce(mockCursor)
      const mockFormId = new ObjectId().toHexString()

      // Act
      const actualResult = getSubmissionCursor(mockFormId)

      // Assert
      expect(getSubmissionSpy).toHaveBeenCalledTimes(1)
      expect(getSubmissionSpy).toHaveBeenCalledWith(mockFormId, {})
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(mockCursor)
    })

    it('should return cursor successfully when date range is provided', async () => {
      // Arrange
      const mockCursor = (jest.fn() as unknown) as mongoose.QueryCursor<any>
      const getSubmissionSpy = jest
        .spyOn(EncryptSubmission, 'getSubmissionCursorByFormId')
        .mockReturnValueOnce(mockCursor)
      const mockFormId = new ObjectId().toHexString()
      const mockDateRange = {
        startDate: '2020-01-01',
        endDate: '2020-10-10',
      }

      // Act
      const actualResult = getSubmissionCursor(mockFormId, mockDateRange)

      // Assert
      expect(getSubmissionSpy).toHaveBeenCalledTimes(1)
      expect(getSubmissionSpy).toHaveBeenCalledWith(mockFormId, mockDateRange)
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(mockCursor)
    })

    it('should return MalformedParametersError when start date is invalid', async () => {
      // Arrange
      const getSubmissionSpy = jest.spyOn(
        EncryptSubmission,
        'getSubmissionCursorByFormId',
      )

      const mockFormId = new ObjectId().toHexString()
      const invalidDateRange = {
        startDate: 'invalid',
        endDate: '2020-10-10',
      }

      // Act
      const actualResult = getSubmissionCursor(mockFormId, invalidDateRange)

      // Assert
      expect(getSubmissionSpy).not.toHaveBeenCalled()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MalformedParametersError('Malformed date parameter'),
      )
    })

    it('should return MalformedParametersError when end date is invalid', async () => {
      // Arrange
      const getSubmissionSpy = jest.spyOn(
        EncryptSubmission,
        'getSubmissionCursorByFormId',
      )

      const mockFormId = new ObjectId().toHexString()
      const invalidDateRange = {
        startDate: '2019-12-12',
        endDate: 'not-a-date',
      }

      // Act
      const actualResult = getSubmissionCursor(mockFormId, invalidDateRange)

      // Assert
      expect(getSubmissionSpy).not.toHaveBeenCalled()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MalformedParametersError('Malformed date parameter'),
      )
    })
  })

  describe('transformAttachmentMetaStream', () => {
    const MOCK_SUB_CURSOR_DATA_1: Partial<SubmissionCursorData> = {
      attachmentMetadata: { mockId1: 'mock metadata 1' },
    }
    const MOCK_SUB_CURSOR_DATA_2: Partial<SubmissionCursorData> = {
      attachmentMetadata: { mockId2: 'mock metadata 2' },
    }

    const EMPTY_METADATA = {
      attachmentMetadata: {},
    }

    beforeEach(() => jest.resetAllMocks())

    it('should successfully transform metadata to signed URL', async () => {
      // Arrange
      const mockFirstS3Url =
        'http://localhost:4566/local-attachment-bucket/path/to/attachment/1?AWSAccessKeyId=fakeKey&Expires=1605248842&Signature=some_signature'
      const mockSecondS3Url =
        'http://localhost:4566/local-attachment-bucket/path/to/attachment/2?AWSAccessKeyId=fakeKey2&Expires=1605248842&Signature=some_signature'
      const mockInput = new PassThrough()
      const expectedExpiry = 20

      const actualTransformedData: any[] = []

      const awsSpy = jest
        .spyOn(aws.s3, 'getSignedUrl')
        // @ts-ignore
        .mockImplementationOnce((_operation, _params, callback) =>
          callback(null, mockFirstS3Url),
        )
        // @ts-ignore
        .mockImplementationOnce((_operation, _params, callback) =>
          callback(null, mockSecondS3Url),
        )

      // Act
      // Build pipeline.
      mockInput
        .pipe(
          transformAttachmentMetaStream({
            enabled: true,
            urlValidDuration: expectedExpiry,
          }),
        )
        .pipe(stringify())
        .on('data', (data) => {
          actualTransformedData.push(JSON.parse(data.toString()))
        })

      // Emit events.
      mockInput.emit('data', clone(MOCK_SUB_CURSOR_DATA_1))
      mockInput.emit('data', clone(MOCK_SUB_CURSOR_DATA_2))

      // Assert
      // Data from end of pipe should have their attachment metadatas replaced
      // by s3 urls.
      expect(actualTransformedData).toEqual([
        {
          attachmentMetadata: {
            mockId1: mockFirstS3Url,
          },
        },
        {
          attachmentMetadata: {
            mockId2: mockSecondS3Url,
          },
        },
      ])
      // Check external service calls.
      expect(awsSpy).toHaveBeenNthCalledWith(
        1,
        'getObject',
        {
          Bucket: aws.attachmentS3Bucket,
          Key: MOCK_SUB_CURSOR_DATA_1.attachmentMetadata!['mockId1'],
          Expires: expectedExpiry,
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect.any(Function),
      )
      expect(awsSpy).toHaveBeenNthCalledWith(
        2,
        'getObject',
        {
          Bucket: aws.attachmentS3Bucket,
          Key: MOCK_SUB_CURSOR_DATA_2.attachmentMetadata!['mockId2'],
          Expires: expectedExpiry,
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect.any(Function),
      )
    })

    it('should return empty data.attachmentMetadata when disabled', async () => {
      // Arrange
      const mockInput = new PassThrough()
      const expectedExpiry = 400
      const actualTransformedData: any[] = []
      const awsSpy = jest.spyOn(aws.s3, 'getSignedUrl')

      // Act
      // Build pipeline.
      mockInput
        .pipe(
          transformAttachmentMetaStream({
            // Disabled pipeline.
            enabled: false,
            urlValidDuration: expectedExpiry,
          }),
        )
        .pipe(stringify())
        .on('data', (data) => {
          actualTransformedData.push(JSON.parse(data.toString()))
        })

      // Emit events.
      mockInput.emit('data', clone(MOCK_SUB_CURSOR_DATA_1))

      // Assert
      expect(actualTransformedData).toEqual([EMPTY_METADATA])
      expect(awsSpy).not.toHaveBeenCalled()
    })

    it('should return empty data.attachmentMetadata when nothing to transform', async () => {
      // Arrange
      const mockInput = new PassThrough()
      const awsSpy = jest.spyOn(aws.s3, 'getSignedUrl')
      const expectedExpiry = 1

      const actualTransformedData: any[] = []

      // Act
      // Build pipeline.
      mockInput
        .pipe(
          transformAttachmentMetaStream({
            enabled: true,
            urlValidDuration: expectedExpiry,
          }),
        )
        .pipe(stringify())
        .on('data', (data) => {
          actualTransformedData.push(JSON.parse(data.toString()))
        })

      // Emit events.
      mockInput.emit('data', EMPTY_METADATA)

      // Assert
      expect(actualTransformedData).toEqual([EMPTY_METADATA])
      expect(awsSpy).not.toHaveBeenCalled()
    })

    it('should return empty data.attachmentMetadata when original metadata is undefined', async () => {
      // Arrange
      const mockInput = new PassThrough()
      const expectedExpiry = 400
      const actualTransformedData: any[] = []
      const awsSpy = jest.spyOn(aws.s3, 'getSignedUrl')

      // Act
      // Build pipeline.
      mockInput
        .pipe(
          transformAttachmentMetaStream({
            enabled: true,
            urlValidDuration: expectedExpiry,
          }),
        )
        .pipe(stringify())
        .on('data', (data) => {
          actualTransformedData.push(JSON.parse(data.toString()))
        })

      // Emit event with empty object.
      mockInput.emit('data', {})

      // Assert
      expect(actualTransformedData).toEqual([EMPTY_METADATA])
      expect(awsSpy).not.toHaveBeenCalled()
    })

    it('should return error when stream errors occurs', async () => {
      // Arrange
      const expectedError = new Error('streams are being crossed right now!!!!')
      const expectedExpiry = 1000
      // Mock AWS S3 error.
      const awsSpy = jest
        .spyOn(aws.s3, 'getSignedUrl')
        // @ts-ignore
        .mockImplementationOnce((_operation, _params, callback) =>
          callback(expectedError),
        )
      const mockInput = new PassThrough()
      const actualErrors: any[] = []

      // Act
      // Build pipeline.
      mockInput
        .pipe(
          transformAttachmentMetaStream({
            enabled: true,
            urlValidDuration: expectedExpiry,
          }),
        )
        .on('error', (error) => actualErrors.push(error))

      // Emit events.
      mockInput.emit('data', clone(MOCK_SUB_CURSOR_DATA_2))

      // Assert
      expect(awsSpy).toHaveBeenCalledWith(
        'getObject',
        {
          Bucket: aws.attachmentS3Bucket,
          Key: MOCK_SUB_CURSOR_DATA_2.attachmentMetadata!['mockId2'],
          Expires: expectedExpiry,
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect.any(Function),
      )
      expect(actualErrors).toEqual([expectedError])
    })
  })

  describe('getEncryptedSubmissionData', () => {
    it('should return submission data successfully', async () => {
      // Arrange
      const expected = {
        encryptedContent: 'mock encrypted content',
        verifiedContent: 'mock verified content',
        attachmentMetadata: new Map([
          ['key1', 'objectPath1'],
          ['key2', 'objectPath2'],
        ]),
        created: new Date(),
      } as SubmissionData

      const getSubmissionSpy = jest
        .spyOn(EncryptSubmission, 'findEncryptedSubmissionById')
        .mockResolvedValueOnce(expected)
      const mockFormId = new ObjectId().toHexString()
      const mockSubmissionId = new ObjectId().toHexString()

      // Act
      const actualResult = await getEncryptedSubmissionData(
        mockFormId,
        mockSubmissionId,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expected)
      expect(getSubmissionSpy).toHaveBeenCalledWith(
        mockFormId,
        mockSubmissionId,
      )
    })

    it('should return SubmissionNotFoundError when submissionId does not exist in the database', async () => {
      // Arrange
      // Return null submission.
      const getSubmissionSpy = jest
        .spyOn(EncryptSubmission, 'findEncryptedSubmissionById')
        .mockResolvedValueOnce(null)
      const mockFormId = new ObjectId().toHexString()
      const mockSubmissionId = new ObjectId().toHexString()

      // Act
      const actualResult = await getEncryptedSubmissionData(
        mockFormId,
        mockSubmissionId,
      )

      // Assert
      // Should be error.
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new SubmissionNotFoundError(
          'Unable to find encrypted submission from database',
        ),
      )
      expect(getSubmissionSpy).toHaveBeenCalledWith(
        mockFormId,
        mockSubmissionId,
      )
    })

    it('should return DatabaseError when error occurs during query', async () => {
      // Arrange
      // Return error when querying for submission.
      const mockErrorString = 'some error'
      const getSubmissionSpy = jest
        .spyOn(EncryptSubmission, 'findEncryptedSubmissionById')
        .mockRejectedValueOnce(new Error(mockErrorString))
      const mockFormId = new ObjectId().toHexString()
      const mockSubmissionId = new ObjectId().toHexString()

      // Act
      const actualResult = await getEncryptedSubmissionData(
        mockFormId,
        mockSubmissionId,
      )

      // Assert
      // Should be error.
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new DatabaseError(mockErrorString),
      )
      expect(getSubmissionSpy).toHaveBeenCalledWith(
        mockFormId,
        mockSubmissionId,
      )
    })
  })

  describe('transformAttachmentMetasToSignedUrls', () => {
    const MOCK_METADATA = new Map([
      ['key1', 'objectPath1'],
      ['key2', 'objectPath2'],
    ])

    it('should return map with transformed signed urls', async () => {
      // Arrange
      // Mock promise implementation.
      jest
        .spyOn(aws.s3, 'getSignedUrlPromise')
        .mockImplementation((_operation, params) => {
          return Promise.resolve(
            `https://some-fake-url/${params.Key}/${params.Expires}`,
          )
        })

      // Act
      const actualResult = await transformAttachmentMetasToSignedUrls(
        MOCK_METADATA,
        200,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      // Should return signed urls mapped to original key.
      expect(actualResult._unsafeUnwrap()).toEqual({
        key1: 'https://some-fake-url/objectPath1/200',
        key2: 'https://some-fake-url/objectPath2/200',
      })
    })

    it('should return empty object when given attachmentMetadata is undefined', async () => {
      // Arrange
      // Mock promise implementation.
      const awsSpy = jest.spyOn(aws.s3, 'getSignedUrlPromise')

      // Act
      const actualResult = await transformAttachmentMetasToSignedUrls(
        undefined,
        200,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      // Should return empty object.
      expect(actualResult._unsafeUnwrap()).toEqual({})
      expect(awsSpy).not.toHaveBeenCalled()
    })

    it('should return empty object when given attachmentMetadata is empty map', async () => {
      // Arrange
      // Mock promise implementation.
      const awsSpy = jest.spyOn(aws.s3, 'getSignedUrlPromise')

      // Act
      const actualResult = await transformAttachmentMetasToSignedUrls(
        new Map(),
        200,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      // Should return empty object.
      expect(actualResult._unsafeUnwrap()).toEqual({})
      expect(awsSpy).not.toHaveBeenCalled()
    })

    it('should return CreatePresignedUrlError when error occurs during the signed url creation process', async () => {
      // Arrange
      jest
        .spyOn(aws.s3, 'getSignedUrlPromise')
        .mockResolvedValueOnce('this passed')
        .mockRejectedValueOnce(new Error('now this fails'))

      // Act
      const actualResult = await transformAttachmentMetasToSignedUrls(
        MOCK_METADATA,
        1000,
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      // Should reject even if there are some passing promises.
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new CreatePresignedUrlError('Failed to create attachment URL'),
      )
    })
  })

  describe('getSubmissionMetadata', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()

    it('should return metadata successfully', async () => {
      // Arrange
      const mockSubmissionId = new ObjectId().toHexString()
      const expectedMetadata: SubmissionMetadata = {
        number: 200,
        refNo: mockSubmissionId,
        submissionTime: 'some submission time',
      }
      const getMetaSpy = jest
        .spyOn(EncryptSubmission, 'findSingleMetadata')
        .mockResolvedValueOnce(expectedMetadata)

      // Act
      const actualResult = await getSubmissionMetadata(
        MOCK_FORM_ID,
        mockSubmissionId,
      )

      // Arrange
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedMetadata)
      expect(getMetaSpy).toHaveBeenCalledWith(MOCK_FORM_ID, mockSubmissionId)
    })

    it('should return null when given submissionId is not valid', async () => {
      // Arrange
      const invalidSubmissionId = 'not an id at all'

      // Act
      const actualResult = await getSubmissionMetadata(
        MOCK_FORM_ID,
        invalidSubmissionId,
      )

      // Arrange
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(null)
    })

    it('should return null when query returns null', async () => {
      // Arrange
      const mockSubmissionId = new ObjectId().toHexString()
      const getMetaSpy = jest
        .spyOn(EncryptSubmission, 'findSingleMetadata')
        .mockResolvedValueOnce(null)

      // Act
      const actualResult = await getSubmissionMetadata(
        MOCK_FORM_ID,
        mockSubmissionId,
      )

      // Arrange
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(null)
      expect(getMetaSpy).toHaveBeenCalledWith(MOCK_FORM_ID, mockSubmissionId)
    })

    it('should return DatabaseError when database error occurs', async () => {
      // Arrange
      const mockSubmissionId = new ObjectId().toHexString()
      const mockErrorString = 'some database error message'
      const getMetaSpy = jest
        .spyOn(EncryptSubmission, 'findSingleMetadata')
        .mockRejectedValueOnce(new Error(mockErrorString))

      // Act
      const actualResult = await getSubmissionMetadata(
        MOCK_FORM_ID,
        mockSubmissionId,
      )

      // Arrange
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new DatabaseError(mockErrorString),
      )
      expect(getMetaSpy).toHaveBeenCalledWith(MOCK_FORM_ID, mockSubmissionId)
    })
  })

  describe('getSubmissionMetadataList', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()

    it('should return metadata list successfully without page param', async () => {
      // Arrange
      const expectedResult = {
        metadata: [
          {
            number: 200,
            refNo: new ObjectId().toHexString(),
            submissionTime: 'some submission time',
          },
        ],
        count: 1,
      }
      const getMetaSpy = jest
        .spyOn(EncryptSubmission, 'findAllMetadataByFormId')
        .mockResolvedValueOnce(expectedResult)

      // Act
      const actualResult = await getSubmissionMetadataList(MOCK_FORM_ID)

      // Arrange
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedResult)
      expect(getMetaSpy).toHaveBeenCalledWith(MOCK_FORM_ID, { page: undefined })
    })

    it('should return metadata list successfully with page param', async () => {
      // Arrange
      const mockPageNumber = 200
      const expectedResult = {
        metadata: [
          {
            number: 9,
            refNo: new ObjectId().toHexString(),
            submissionTime: 'another submission time',
          },
        ],
        count: 1,
      }
      const getMetaSpy = jest
        .spyOn(EncryptSubmission, 'findAllMetadataByFormId')
        .mockResolvedValueOnce(expectedResult)

      // Act
      const actualResult = await getSubmissionMetadataList(
        MOCK_FORM_ID,
        mockPageNumber,
      )

      // Arrange
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedResult)
      expect(getMetaSpy).toHaveBeenCalledWith(MOCK_FORM_ID, {
        page: mockPageNumber,
      })
    })

    it('should return DatabaseError when database error occurs', async () => {
      // Arrange
      const mockErrorString = 'some database error message'
      const getMetaSpy = jest
        .spyOn(EncryptSubmission, 'findAllMetadataByFormId')
        .mockRejectedValueOnce(new Error(mockErrorString))

      // Act
      const actualResult = await getSubmissionMetadataList(MOCK_FORM_ID)

      // Arrange
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new DatabaseError(mockErrorString),
      )
      expect(getMetaSpy).toHaveBeenCalledWith(MOCK_FORM_ID, { page: undefined })
    })
  })
})

/**
 * Helper function to create a transform stream that converts Buffers to strings.
 */
const stringify = () =>
  new Transform({
    objectMode: true,
    transform: function (chunk, _encoding, callback) {
      return callback(null, JSON.stringify(chunk, null, 4) + '\n')
    },
  })
