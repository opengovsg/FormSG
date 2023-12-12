/* eslint-disable @typescript-eslint/ban-ts-comment */
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson-ext'
import mongoose from 'mongoose'
import { Readable } from 'stream'

import { aws } from 'src/app/config/config'
import { getEncryptSubmissionModel } from 'src/app/models/submission.server.model'
import { CreatePresignedPostError } from 'src/app/utils/aws-s3'
import { IPopulatedEncryptedForm } from 'src/types'

import { aws as AwsConfig } from '../../../../config/config'
import {
  AttachmentSizeLimitExceededError,
  DownloadCleanFileFailedError,
  InvalidFieldIdError,
  InvalidFileKeyError,
  ParseVirusScannerLambdaPayloadError,
  VirusScanFailedError,
} from '../encrypt-submission.errors'
import {
  createEncryptSubmissionWithoutSave,
  downloadCleanFile,
  getQuarantinePresignedPostData,
  transformAttachmentMetasToSignedUrls,
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
