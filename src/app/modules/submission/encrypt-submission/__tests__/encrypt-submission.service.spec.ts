/* eslint-disable @typescript-eslint/ban-ts-comment */
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { clone, omit } from 'lodash'
import mongoose from 'mongoose'
import { errAsync, okAsync } from 'neverthrow'
import { PassThrough, Readable, Transform } from 'stream'

import { aws } from 'src/app/config/config'
import { getEncryptSubmissionModel } from 'src/app/models/submission.server.model'
import {
  DatabaseError,
  MalformedParametersError,
} from 'src/app/modules/core/core.errors'
import { PaymentNotFoundError } from 'src/app/modules/payments/payments.errors'
import { CreatePresignedPostError } from 'src/app/utils/aws-s3'
import { formatErrorRecoveryMessage } from 'src/app/utils/handle-mongo-error'
import {
  IPaymentSchema,
  IPopulatedEncryptedForm,
  SubmissionCursorData,
  SubmissionData,
} from 'src/types'

import {
  StorageModeSubmissionMetadata,
  SubmissionId,
} from '../../../../../../shared/types'
import { aws as AwsConfig } from '../../../../config/config'
import * as PaymentsService from '../../../payments/payments.service'
import { SubmissionNotFoundError } from '../../submission.errors'
import {
  AttachmentSizeLimitExceededError,
  DownloadCleanFileFailedError,
  InvalidFieldIdError,
  InvalidFileKeyError,
  ParseVirusScannerLambdaPayloadError,
  VirusScanFailedError,
} from '../encrypt-submission.errors'
import {
  addPaymentDataStream,
  createEncryptSubmissionWithoutSave,
  downloadCleanFile,
  getEncryptedSubmissionData,
  getQuarantinePresignedPostData,
  getSubmissionCursor,
  getSubmissionMetadata,
  getSubmissionMetadataList,
  getSubmissionPaymentDto,
  transformAttachmentMetasToSignedUrls,
  transformAttachmentMetaStream,
  triggerVirusScanning,
} from '../encrypt-submission.service'

const EncryptSubmission = getEncryptSubmissionModel(mongoose)

describe('encrypt-submission.service', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('createEncryptSubmissionWithoutSave', () => {
    const MOCK_FORM = {
      admin: new ObjectId(),
      _id: new ObjectId(),
      title: 'mock title',
      getUniqueMyInfoAttrs: () => [],
      authType: 'NIL',
    } as unknown as IPopulatedEncryptedForm
    const MOCK_ENCRYPTED_CONTENT = 'mockEncryptedContent'
    const MOCK_VERIFIED_CONTENT = 'mockVerifiedContent'
    const MOCK_VERSION = 1
    const MOCK_ATTACHMENT_METADATA = new Map([['a', 'b']])

    it('should create a new submission without saving it to the database', async () => {
      const result = createEncryptSubmissionWithoutSave({
        encryptedContent: MOCK_ENCRYPTED_CONTENT,
        form: MOCK_FORM,
        version: MOCK_VERSION,
        attachmentMetadata: MOCK_ATTACHMENT_METADATA,
        verifiedContent: MOCK_VERIFIED_CONTENT,
      })
      const foundInDatabase = await EncryptSubmission.findOne({
        _id: result._id,
      })

      expect(result.encryptedContent).toBe(MOCK_ENCRYPTED_CONTENT)
      expect(result.form).toEqual(MOCK_FORM._id)
      expect(result.verifiedContent).toEqual(MOCK_VERIFIED_CONTENT)
      expect(Object.fromEntries(result.attachmentMetadata!)).toEqual(
        Object.fromEntries(MOCK_ATTACHMENT_METADATA),
      )
      expect(result.version).toEqual(MOCK_VERSION)
      expect(foundInDatabase).toBeNull()
    })
  })

  describe('getSubmissionCursor', () => {
    it('should return cursor successfully when date range is not provided', async () => {
      // Arrange
      const mockCursor = jest.fn() as unknown as mongoose.QueryCursor<any>
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
      const mockCursor = jest.fn() as unknown as mongoose.QueryCursor<any>
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
        .mockImplementationOnce((_operation, _params, callback) => {
          return callback(expectedError)
        })
      const mockInput = new PassThrough()

      // Act
      // Build (promisified) pipeline for testing.
      const streamPromise = new Promise((resolve, reject) => {
        mockInput
          .pipe(
            transformAttachmentMetaStream({
              enabled: true,
              urlValidDuration: expectedExpiry,
            }),
          )
          .on('finish', resolve)
          .on('error', reject)
      })

      // Emit events.
      mockInput.emit('data', clone(MOCK_SUB_CURSOR_DATA_2))

      // Assert
      // Should reject since error is returned from callback.
      await expect(streamPromise).rejects.toEqual(expectedError)
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
    })
  })

  describe('addPaymentDataStream', () => {
    const MOCK_SUB_CURSOR_DATA_1: Partial<SubmissionCursorData> = {
      encryptedContent: 'some encrypted content 1',
      paymentId: 'mockPaymentId1',
    }

    const MOCK_SUB_CURSOR_DATA_2: Partial<SubmissionCursorData> = {
      encryptedContent: 'some encrypted content 2',
      paymentId: 'mockPaymentId2',
    }

    const MOCK_PAYMENT_1 = {
      _id: 'mockPaymentId1',
      paymentIntentId: 'pi_MOCK_PAYMENT_INTENT_ID_1',
      status: 'succeeded',
      email: 'form@tech.gov.sg',
      amount: 3141,

      completedPayment: {
        paymentDate: new Date(1680770362473),
        transactionFee: 600,
        receiptUrl: 'https://some.random.url.com',
      },

      payout: {
        payoutId: 'po_MOCK_PAYOUT_ID_1',
        payoutDate: new Date(1680870362473),
      },
    } as IPaymentSchema

    const MOCK_SUBMISSION_PAYMENT_DTO_1 = {
      id: 'mockPaymentId1',
      paymentIntentId: 'pi_MOCK_PAYMENT_INTENT_ID_1',
      email: 'form@tech.gov.sg',
      amount: 3141,
      status: 'succeeded',

      paymentDate: 'Thu, 6 Apr 2023, 04:39:22 PM',
      transactionFee: 600,
      receiptUrl: 'https://some.random.url.com',

      payoutId: 'po_MOCK_PAYOUT_ID_1',
      payoutDate: 'Fri, 7 Apr 2023',
    }

    const MOCK_PAYMENT_2 = {
      _id: 'mockPaymentId2',
      paymentIntentId: 'pi_MOCK_PAYMENT_INTENT_ID_2',
      status: 'succeeded',
      email: 'open@tech.gov.sg',
      amount: 12345,

      completedPayment: {
        paymentDate: new Date(1680771362473),
        transactionFee: 123,
        receiptUrl: 'https://some.random.url-2.com',
      },

      payout: {
        payoutId: 'po_MOCK_PAYOUT_ID_2',
        payoutDate: new Date(1680871362473),
      },
    } as IPaymentSchema

    const MOCK_SUBMISSION_PAYMENT_DTO_2 = {
      id: 'mockPaymentId2',
      paymentIntentId: 'pi_MOCK_PAYMENT_INTENT_ID_2',
      email: 'open@tech.gov.sg',
      amount: 12345,
      status: 'succeeded',

      paymentDate: 'Thu, 6 Apr 2023, 04:56:02 PM',
      transactionFee: 123,
      receiptUrl: 'https://some.random.url-2.com',

      payoutId: 'po_MOCK_PAYOUT_ID_2',
      payoutDate: 'Fri, 7 Apr 2023',
    }

    beforeEach(() => jest.resetAllMocks())

    it('should successfully transform payment id to submission payment DTO', async () => {
      // Arrange
      const mockInput = new PassThrough()

      const actualTransformedData: any[] = []

      const findSpy = jest
        .spyOn(PaymentsService, 'findPaymentById')
        .mockImplementationOnce(() => okAsync(MOCK_PAYMENT_1 as IPaymentSchema))
        .mockImplementationOnce(() => okAsync(MOCK_PAYMENT_2 as IPaymentSchema))

      // Act
      // Build (promisified) pipeline for testing.
      const streamPromise = new Promise((resolve) => {
        mockInput
          .pipe(addPaymentDataStream())
          .on('data', (data) => actualTransformedData.push(data))
          .on('end', resolve)
      })

      // Emit events.
      mockInput.emit('data', clone(MOCK_SUB_CURSOR_DATA_1))
      mockInput.emit('data', clone(MOCK_SUB_CURSOR_DATA_2))
      mockInput.end()
      await streamPromise

      // Assert
      // Data from end of pipe should have their paymentIds replaced by
      // submission payment objects.
      expect(actualTransformedData).toEqual([
        {
          ...omit(MOCK_SUB_CURSOR_DATA_1, 'paymentId'),
          payment: MOCK_SUBMISSION_PAYMENT_DTO_1,
        },
        {
          ...omit(MOCK_SUB_CURSOR_DATA_2, 'paymentId'),
          payment: MOCK_SUBMISSION_PAYMENT_DTO_2,
        },
      ])
      // Check external service calls.
      expect(findSpy).toHaveBeenNthCalledWith(
        1,
        MOCK_SUB_CURSOR_DATA_1.paymentId,
      )
      expect(findSpy).toHaveBeenNthCalledWith(
        2,
        MOCK_SUB_CURSOR_DATA_2.paymentId,
      )
    })

    it('should return empty payment when no payment id is present', async () => {
      // Arrange
      const mockInput = new PassThrough()
      const findSpy = jest.spyOn(PaymentsService, 'findPaymentById')

      const actualTransformedData: any[] = []

      // Act
      // Build pipeline.
      mockInput
        .pipe(addPaymentDataStream())
        .pipe(stringify())
        .on('data', (data) => {
          actualTransformedData.push(JSON.parse(data.toString()))
        })

      // Emit events.
      mockInput.emit('data', {})

      // Assert
      expect(actualTransformedData).toEqual([{}])
      expect(findSpy).not.toHaveBeenCalled()
    })

    it('should return original object without payment id when stream errors occurs', async () => {
      // Arrange
      const expectedError = new Error('streams are being crossed right now!!!!')
      // Mock database error.
      const findSpy = jest
        .spyOn(PaymentsService, 'findPaymentById')
        .mockImplementationOnce(() => errAsync(expectedError))
      const mockInput = new PassThrough()

      const actualTransformedData: any[] = []

      // Act
      // Build (promisified) pipeline for testing.
      const streamPromise = new Promise((resolve) => {
        mockInput
          .pipe(addPaymentDataStream())
          .on('data', (data) => actualTransformedData.push(data))
          .on('end', resolve)
      })

      // Emit events.
      mockInput.emit('data', clone(MOCK_SUB_CURSOR_DATA_1))
      mockInput.end()
      await streamPromise

      // Assert
      // Data from end of pipe should have their paymentIds replaced by
      // submission payment objects.
      expect(actualTransformedData).toEqual([
        omit(MOCK_SUB_CURSOR_DATA_1, 'paymentId'),
      ])
      // Check external service calls.
      expect(findSpy).toHaveBeenNthCalledWith(
        1,
        MOCK_SUB_CURSOR_DATA_1.paymentId,
      )
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
        new DatabaseError(formatErrorRecoveryMessage(mockErrorString)),
      )
      expect(getSubmissionSpy).toHaveBeenCalledWith(
        mockFormId,
        mockSubmissionId,
      )
    })
  })

  describe('getSubmissionPaymentDto', () => {
    const MOCK_PAYMENT_ID = 'mockPaymentId'

    it('should return submission payment data successfully', async () => {
      // Arrange
      const payment = {
        _id: MOCK_PAYMENT_ID,
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT_ID',
        status: 'succeeded',
        email: 'form@tech.gov.sg',
        amount: 3141,

        completedPayment: {
          paymentDate: new Date(1680766919),
          transactionFee: 600,
          receiptUrl: 'https://some.random.url.com',
        },

        payout: {
          payoutId: 'po_MOCK_PAYOUT_ID',
          payoutDate: new Date(1681766919),
        },
      } as IPaymentSchema

      const expected = {
        id: MOCK_PAYMENT_ID,
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT_ID',
        email: 'form@tech.gov.sg',
        amount: 3141,
        status: 'succeeded',

        paymentDate: 'Tue, 20 Jan 1970, 06:22:46 PM',
        transactionFee: 600,
        receiptUrl: 'https://some.random.url.com',

        payoutId: 'po_MOCK_PAYOUT_ID',
        payoutDate: 'Tue, 20 Jan 1970',
      }

      const findSpy = jest
        .spyOn(PaymentsService, 'findPaymentById')
        .mockImplementationOnce(() => okAsync(payment))

      // Act
      const actualResult = await getSubmissionPaymentDto(MOCK_PAYMENT_ID)

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expected)
      expect(findSpy).toHaveBeenCalledWith(MOCK_PAYMENT_ID)
    })

    it('should return PaymentNotFoundError when payment does not exist in the database', async () => {
      // Arrange
      const findSpy = jest
        .spyOn(PaymentsService, 'findPaymentById')
        .mockImplementationOnce(() => errAsync(new PaymentNotFoundError()))

      // Act
      const actualResult = await getSubmissionPaymentDto(MOCK_PAYMENT_ID)

      // Assert
      // Should be error.
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new PaymentNotFoundError(),
      )
      expect(findSpy).toHaveBeenCalledWith(MOCK_PAYMENT_ID)
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

    it('should return CreatePresignedPostError when error occurs during the signed url creation process', async () => {
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
        new CreatePresignedPostError('Failed to create attachment URL'),
      )
    })
  })

  describe('getSubmissionMetadata', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()

    it('should return metadata successfully', async () => {
      // Arrange
      const mockSubmissionId = new ObjectId().toHexString()
      const expectedMetadata: StorageModeSubmissionMetadata = {
        number: 200,
        refNo: mockSubmissionId as SubmissionId,
        submissionTime: 'some submission time',
        payments: {
          paymentAmt: 0,
          email: '',
          payoutDate: null,
          transactionFee: null,
        },
      }
      const getMetaSpy = jest
        .spyOn(EncryptSubmission, 'findSingleMetadata')
        .mockResolvedValueOnce(expectedMetadata)

      // Act
      const actualResult = await getSubmissionMetadata(
        MOCK_FORM_ID,
        mockSubmissionId,
      )

      // Assert
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

      // Assert
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

      // Assert
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

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new DatabaseError(formatErrorRecoveryMessage(mockErrorString)),
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
        ] as StorageModeSubmissionMetadata[],
        count: 1,
      }
      const getMetaSpy = jest
        .spyOn(EncryptSubmission, 'findAllMetadataByFormId')
        .mockResolvedValueOnce(expectedResult)

      // Act
      const actualResult = await getSubmissionMetadataList(MOCK_FORM_ID)

      // Assert
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
        ] as StorageModeSubmissionMetadata[],
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

      // Assert
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

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new DatabaseError(formatErrorRecoveryMessage(mockErrorString)),
      )
      expect(getMetaSpy).toHaveBeenCalledWith(MOCK_FORM_ID, { page: undefined })
    })
  })

  describe('getQuarantinePresignedPostData', () => {
    const fieldId1 = new mongoose.Types.ObjectId().toHexString()
    const fieldId2 = new mongoose.Types.ObjectId().toHexString()
    const MOCK_ATTACHMENT_SIZES = [
      { id: fieldId1, size: 1 },
      { id: fieldId2, size: 2 },
    ]

    const REGEX_UUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    it('should return presigned post data', async () => {
      // Arrange
      const awsSpy = jest.spyOn(aws.s3, 'createPresignedPost')
      const expectedCalledWithSubset = {
        Bucket: AwsConfig.virusScannerQuarantineS3Bucket,
        Fields: { key: expect.stringMatching(REGEX_UUID) },
        Expires: 1 * 60, // expires in 1 minutes
      }
      const expectedPresignedPostData = expect.objectContaining({
        url: `${AwsConfig.endPoint}/${AwsConfig.virusScannerQuarantineS3Bucket}`,
        fields: expect.objectContaining({
          key: expect.stringMatching(REGEX_UUID),
          bucket: AwsConfig.virusScannerQuarantineS3Bucket,
          'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
        }),
      })

      // Act
      const actualResult = await getQuarantinePresignedPostData(
        MOCK_ATTACHMENT_SIZES,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(awsSpy).toHaveBeenCalledTimes(2)
      expect(awsSpy.mock.calls).toEqual([
        [
          {
            ...expectedCalledWithSubset,
            Conditions: [['content-length-range', 0, 1]],
          },
          expect.any(Function), // anonymous error handling function
        ],
        [
          {
            ...expectedCalledWithSubset,
            Conditions: [['content-length-range', 0, 2]],
          },
          expect.any(Function), // anonymous error handling function
        ],
      ])
      const actualResultValue = actualResult._unsafeUnwrap()
      expect(actualResultValue).toEqual(
        expect.objectContaining([
          { id: fieldId1, presignedPostData: expectedPresignedPostData },
          { id: fieldId2, presignedPostData: expectedPresignedPostData },
        ]),
      )
    })

    it('should return CreatePresignedPostError when aws.s3.createPresignedPost throws error', async () => {
      // Arrange
      const awsSpy = jest
        .spyOn(aws.s3, 'createPresignedPost')
        .mockImplementationOnce(() => {
          throw new Error('some error')
        })

      // Act
      const actualResult = await getQuarantinePresignedPostData(
        MOCK_ATTACHMENT_SIZES,
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(awsSpy).toHaveBeenCalled()
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new CreatePresignedPostError(),
      )
      expect(awsSpy).toHaveBeenCalledWith(
        {
          Bucket: AwsConfig.virusScannerQuarantineS3Bucket,
          Fields: { key: expect.stringMatching(REGEX_UUID) },
          Expires: 1 * 60, // expires in 1 minutes
          Conditions: [['content-length-range', 0, 1]],
        },
        expect.any(Function), // anonymous error handling function
      )
    })

    it('should return InvalidFieldIdError when ids are not valid mongodb object ids', async () => {
      // Arrange
      const awsSpy = jest.spyOn(aws.s3, 'createPresignedPost')

      // Act
      const actualResult = await getQuarantinePresignedPostData([
        { id: 'test_file_1', size: 1 },
      ])

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(awsSpy).not.toHaveBeenCalled()
      expect(actualResult._unsafeUnwrapErr()).toEqual(new InvalidFieldIdError())
    })

    it('should return AttachmentSizeLimitExceededError when total attachment size has exceeded 20MB', async () => {
      // Act
      const actualResult = await getQuarantinePresignedPostData([
        { id: fieldId1, size: 2 },
        { id: fieldId2, size: 19999999 },
      ])

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new AttachmentSizeLimitExceededError(),
      )
    })
  })

  describe('triggerVirusScanning', () => {
    const MOCK_VALID_FILE_KEY = '1b90195b-ce8a-4590-810b-04ebaef8e4dd'
    const MOCK_SUCCESS_BODY_PAYLOAD = {
      cleanFileKey: 'cleanFileKey',
      destinationVersionId: 'destinationVersionId',
    }
    it('should return errAsync when quarantine file key is not a valid uuid', async () => {
      // Arrange
      const awsSpy = jest
        .spyOn(aws.virusScannerLambda, 'invoke')
        .mockImplementationOnce(() => {
          return Promise.reject()
        })
      const mockQuarantineFileKey = 'not a uuid'

      // Act
      const actualResult = await triggerVirusScanning(mockQuarantineFileKey)

      // Assert
      expect(awsSpy).not.toHaveBeenCalled()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(new InvalidFileKeyError())
    })

    it('should return errAsync when lambda invocation fails', async () => {
      // Arrange
      const awsSpy = jest
        .spyOn(aws.virusScannerLambda, 'invoke')
        .mockImplementationOnce(() => {
          return Promise.reject()
        })

      // Act
      const actualResult = await triggerVirusScanning(MOCK_VALID_FILE_KEY)

      // Assert
      expect(awsSpy).toHaveBeenCalledOnce()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new VirusScanFailedError(),
      )
    })

    it('should return errAsync when data is undefined', async () => {
      // Arrange
      const awsSpy = jest
        .spyOn(aws.virusScannerLambda, 'invoke')
        .mockImplementationOnce(() => {
          return Promise.resolve(undefined)
        })

      // Act
      const actualResult = await triggerVirusScanning(MOCK_VALID_FILE_KEY)

      // Assert
      expect(awsSpy).toHaveBeenCalledOnce()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new ParseVirusScannerLambdaPayloadError(),
      )
    })

    it('should return errAsync when data.Payload is undefined', async () => {
      // Arrange
      const awsSpy = jest
        .spyOn(aws.virusScannerLambda, 'invoke')
        .mockImplementationOnce(() => {
          return Promise.resolve({ Payload: undefined })
        })

      // Act
      const actualResult = await triggerVirusScanning(MOCK_VALID_FILE_KEY)

      // Assert
      expect(awsSpy).toHaveBeenCalledOnce()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new ParseVirusScannerLambdaPayloadError(),
      )
    })

    it('should return okAsync with cleanFileKey and destinationVersionId when data.Payload successful', async () => {
      // Arrange
      const successPayload = {
        statusCode: 200,
        body: JSON.stringify(MOCK_SUCCESS_BODY_PAYLOAD),
      }
      const awsSpy = jest
        .spyOn(aws.virusScannerLambda, 'invoke')
        .mockImplementationOnce(() => {
          return Promise.resolve({
            Payload: JSON.stringify(successPayload),
          })
        })
      const expectedSuccessOutput = {
        statusCode: 200,
        body: MOCK_SUCCESS_BODY_PAYLOAD,
      }

      // Act
      const actualResult = await triggerVirusScanning(MOCK_VALID_FILE_KEY)

      // Assert
      expect(awsSpy).toHaveBeenCalledOnce()
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedSuccessOutput)
    })

    it('should return errAsync if payload cannot be parsed', async () => {
      // Arrange
      const awsSpy = jest
        .spyOn(aws.virusScannerLambda, 'invoke')
        .mockImplementationOnce(() => {
          return Promise.resolve({
            Payload: '{',
          })
        })

      // Act
      const actualResult = await triggerVirusScanning(MOCK_VALID_FILE_KEY)

      // Assert
      expect(awsSpy).toHaveBeenCalledOnce()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new ParseVirusScannerLambdaPayloadError(),
      )
    })

    it('should return errAsync if payload.statusCode is not a number', async () => {
      // Arrange
      const successPayload = {
        statusCode: 'two hundred', // not a number
        body: JSON.stringify(MOCK_SUCCESS_BODY_PAYLOAD),
      }
      const awsSpy = jest
        .spyOn(aws.virusScannerLambda, 'invoke')
        .mockImplementationOnce(() => {
          return Promise.resolve({
            Payload: JSON.stringify(successPayload),
          })
        })

      // Act
      const actualResult = await triggerVirusScanning(MOCK_VALID_FILE_KEY)

      // Assert
      expect(awsSpy).toHaveBeenCalledOnce()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new ParseVirusScannerLambdaPayloadError(),
      )
    })

    it('should return errAsync if payload.body is not a string', async () => {
      // Arrange
      const successPayload = {
        statusCode: 200,
        body: 2023, // not a string
      }
      const awsSpy = jest
        .spyOn(aws.virusScannerLambda, 'invoke')
        .mockImplementationOnce(() => {
          return Promise.resolve({
            Payload: JSON.stringify(successPayload),
          })
        })

      // Act
      const actualResult = await triggerVirusScanning(MOCK_VALID_FILE_KEY)

      // Assert
      expect(awsSpy).toHaveBeenCalledOnce()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new ParseVirusScannerLambdaPayloadError(),
      )
    })

    it('should return errAsync if payload body cannot be parsed', async () => {
      // Arrange
      const invalidSuccessPayload = {
        statusCode: 200,
        body: '}',
      }
      const awsSpy = jest
        .spyOn(aws.virusScannerLambda, 'invoke')
        .mockImplementationOnce(() => {
          return Promise.resolve({
            Payload: JSON.stringify(invalidSuccessPayload),
          })
        })

      // Act
      const actualResult = await triggerVirusScanning(MOCK_VALID_FILE_KEY)

      // Assert
      expect(awsSpy).toHaveBeenCalledOnce()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new ParseVirusScannerLambdaPayloadError(),
      )
    })

    it('should return errAsync if cleanFileKey is not a string', async () => {
      // Arrange
      const invalidSuccessPayload = {
        statusCode: 200,
        body: {
          ...MOCK_SUCCESS_BODY_PAYLOAD,
          cleanFileKey: true, // not a string
        },
      }
      const awsSpy = jest
        .spyOn(aws.virusScannerLambda, 'invoke')
        .mockImplementationOnce(() => {
          return Promise.resolve({
            Payload: JSON.stringify(invalidSuccessPayload),
          })
        })

      // Act
      const actualResult = await triggerVirusScanning(MOCK_VALID_FILE_KEY)

      // Assert
      expect(awsSpy).toHaveBeenCalledOnce()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new ParseVirusScannerLambdaPayloadError(),
      )
    })

    it('should return errAsync if destinationVersionId is not a string', async () => {
      // Arrange
      const invalidSuccessPayload = {
        statusCode: 200,
        body: {
          ...MOCK_SUCCESS_BODY_PAYLOAD,
          destinationVersionId: 2023, // not a string
        },
      }
      const awsSpy = jest
        .spyOn(aws.virusScannerLambda, 'invoke')
        .mockImplementationOnce(() => {
          return Promise.resolve({
            Payload: JSON.stringify(invalidSuccessPayload),
          })
        })

      // Act
      const actualResult = await triggerVirusScanning(MOCK_VALID_FILE_KEY)

      // Assert
      expect(awsSpy).toHaveBeenCalledOnce()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new ParseVirusScannerLambdaPayloadError(),
      )
    })

    it('should return errAsync if lambda returns an errored response (e.g. file not found) when a valid file key is used', async () => {
      // Arrange
      const failurePayload = {
        statusCode: 404,
        body: JSON.stringify({
          message: 'File not found',
        }),
      }
      const awsSpy = jest
        .spyOn(aws.virusScannerLambda, 'invoke')
        .mockImplementationOnce(() => {
          return Promise.resolve({
            Payload: JSON.stringify(failurePayload),
          })
        })

      // Act
      const actualResult = await triggerVirusScanning(MOCK_VALID_FILE_KEY)

      // Assert
      expect(awsSpy).toHaveBeenCalledOnce()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new InvalidFileKeyError(
          'Invalid file key - file key is not found in the quarantine bucket. The file must be uploaded first.',
        ),
      )
    })

    it("should return errAsync if the lambda's errored response is not in the right format", async () => {
      // Arrange
      const failurePayload = {
        statusCode: 200,
        body: JSON.stringify({
          message: true, // not a string
        }),
      }
      const awsSpy = jest
        .spyOn(aws.virusScannerLambda, 'invoke')
        .mockImplementationOnce(() => {
          return Promise.resolve({
            Payload: JSON.stringify(failurePayload),
          })
        })

      // Act
      const actualResult = await triggerVirusScanning(MOCK_VALID_FILE_KEY)

      // Assert
      expect(awsSpy).toHaveBeenCalledOnce()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new ParseVirusScannerLambdaPayloadError(),
      )
    })
  })

  describe('downloadCleanFile', () => {
    const MOCK_VALID_UUID = '0f3d2e22-d2aa-44f8-965a-27e46102936e'
    it('should return errAsync(InvalidFileKeyError) if cleanFileKey is invalid', async () => {
      // Arrange
      const awsSpy = jest.spyOn(aws.s3, 'getObject')

      // Act
      // empty string for version id to simulate failure
      const actualResult = await downloadCleanFile('invalid-key', '')

      // Assert
      expect(awsSpy).not.toHaveBeenCalled()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(new InvalidFileKeyError())
    })

    it('should return errAsync(DownloadCleanFileFailedError) if file download failed', async () => {
      // Arrange
      const awsSpy = jest.spyOn(aws.s3, 'getObject')

      // Act
      // empty string for version id to simulate failure
      const actualResult = await downloadCleanFile(MOCK_VALID_UUID, '')

      // Assert
      expect(awsSpy).toHaveBeenCalledOnce()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new DownloadCleanFileFailedError(),
      )
    })

    it('should return okAsync(buffer) if file has been successfully downloaded from the clean bucket', async () => {
      // Arrange
      const content = 'Mock file with a lot of text content!'
      // Define a custom mock function for getObject
      const mockGetObject = jest.fn().mockReturnValue({
        createReadStream: () => {
          // Create a readable stream with the desired content
          const readStream = new Readable({
            read() {
              this.push(content)
              this.push(null) // Indicates the end of the stream
            },
          })
          return readStream
        },
      })

      const awsSpy = jest
        .spyOn(aws.s3, 'getObject')
        .mockImplementationOnce(mockGetObject)

      const versionId = 'your-version-id'

      // Act
      // empty strings for invalid keys and version ids
      const actualResult = await downloadCleanFile(MOCK_VALID_UUID, versionId)

      // Assert
      expect(awsSpy).toHaveBeenCalledOnce()
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap().toString()).toEqual(content)
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
