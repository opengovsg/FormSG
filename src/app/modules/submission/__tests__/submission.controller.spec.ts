import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { ObjectId } from 'bson'
import { StatusCodes } from 'http-status-codes'
import { err, errAsync, ok, okAsync } from 'neverthrow'
import {
  AttachmentPresignedPostDataMapType,
  AttachmentSizeMapType,
  FormResponseMode,
  SubmissionId,
  SubmissionMetadata,
  SubmissionPaymentDto,
  SubmissionType,
} from 'shared/types'

import * as AuthService from 'src/app/modules/auth/auth.service'
import { DatabaseError } from 'src/app/modules/core/core.errors'
import * as FeatureFlagService from 'src/app/modules/feature-flags/feature-flags.service'
import { PermissionLevel } from 'src/app/modules/form/admin-form/admin-form.types'
import {
  ForbiddenFormError,
  FormDeletedError,
  FormNotFoundError,
} from 'src/app/modules/form/form.errors'
import { PaymentNotFoundError } from 'src/app/modules/payments/payments.errors'
import { MissingUserError } from 'src/app/modules/user/user.errors'
import * as UserService from 'src/app/modules/user/user.service'
import { CreatePresignedPostError } from 'src/app/utils/aws-s3'
import {
  IPopulatedEncryptedForm,
  IPopulatedForm,
  IPopulatedUser,
  SubmissionData,
} from 'src/types'

import * as EncryptSubmissionService from '../encrypt-submission/encrypt-submission.service'
import {
  getMetadata,
  getS3PresignedPostData,
  handleGetEncryptedResponse,
  streamEncryptedResponses,
} from '../submission.controller'
import {
  ResponseModeError,
  SubmissionNotFoundError,
} from '../submission.errors'
import * as SubmissionService from '../submission.service'
import * as SubmissionsUtils from '../submission.utils'

jest.mock('src/app/modules/submission/submission.service')
jest.mock(
  'src/app/modules/submission/encrypt-submission/encrypt-submission.service',
)
jest.mock('src/app/modules/user/user.service')
jest.mock('src/app/modules/auth/auth.service')
jest.mock('src/app/modules/feature-flags/feature-flags.service')
jest.mock('src/app/modules/feature-flags/feature-flags.service')
const MockSubService = jest.mocked(SubmissionService)
const MockEncryptSubService = jest.mocked(EncryptSubmissionService)
const MockUserService = jest.mocked(UserService)
const MockAuthService = jest.mocked(AuthService)
const MockFeatureFlagService = jest.mocked(FeatureFlagService)

describe('submission.controller', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('getMetadata', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()
    const MOCK_USER_ID = new ObjectId().toHexString()

    const MOCK_USER = {
      _id: MOCK_USER_ID,
      email: 'somerandom@example.com',
    } as IPopulatedUser
    const MOCK_FORM = {
      admin: MOCK_USER,
      _id: MOCK_FORM_ID,
      title: 'mock title',
      responseMode: FormResponseMode.Encrypt,
    } as IPopulatedForm

    beforeEach(() => {
      MockUserService.getPopulatedUserById.mockReturnValue(okAsync(MOCK_USER))
      MockAuthService.getFormAfterPermissionChecks.mockReturnValue(
        okAsync(MOCK_FORM),
      )
      MockEncryptSubService.checkFormIsEncryptMode.mockReturnValue(
        ok(MOCK_FORM as IPopulatedEncryptedForm),
      )
    })

    it('should return 200 with single submission metadata when query.submissionId is provided and can be found', async () => {
      // Arrange
      const mockSubmissionId = new ObjectId().toHexString() as SubmissionId
      const mockReq = expressHandler.mockRequest({
        params: { formId: MOCK_FORM_ID },
        query: {
          submissionId: mockSubmissionId,
        },
        session: {
          user: {
            _id: MOCK_USER_ID,
          },
        },
      })
      const mockRes = expressHandler.mockResponse()
      // Mock service result.
      const expectedMetadata: SubmissionMetadata = {
        number: 2,
        refNo: mockSubmissionId,
        submissionTime: 'some submission time',
        payments: {
          payoutDate: null,
          paymentAmt: 0,
          transactionFee: null,
          email: '',
        },
      }

      MockSubService.getSubmissionMetadata.mockReturnValueOnce(
        okAsync(expectedMetadata),
      )

      // Act
      await getMetadata(mockReq, mockRes, jest.fn())

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        metadata: [expectedMetadata],
        count: 1,
      })
      expect(MockSubService.getSubmissionMetadataList).not.toHaveBeenCalled()
      expect(MockSubService.getSubmissionMetadata).toHaveBeenCalledWith(
        FormResponseMode.Encrypt,
        MOCK_FORM_ID,
        mockSubmissionId,
      )
    })

    it('should return 200 with empty submission metadata when query.submissionId is provided but cannot be found', async () => {
      // Arrange
      const mockSubmissionId = new ObjectId().toHexString()
      const mockReq = expressHandler.mockRequest({
        params: { formId: MOCK_FORM_ID },
        query: {
          submissionId: mockSubmissionId,
        },
        session: {
          user: {
            _id: MOCK_USER_ID,
          },
        },
      })
      const mockRes = expressHandler.mockResponse()
      // Mock service result.
      MockSubService.getSubmissionMetadata.mockReturnValueOnce(okAsync(null))

      // Act
      await getMetadata(mockReq, mockRes, jest.fn())

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        metadata: [],
        count: 0,
      })
      expect(MockSubService.getSubmissionMetadataList).not.toHaveBeenCalled()
      expect(MockSubService.getSubmissionMetadata).toHaveBeenCalledWith(
        FormResponseMode.Encrypt,
        MOCK_FORM_ID,
        mockSubmissionId,
      )
    })

    it('should return 200 with list of submission metadata', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        params: { formId: MOCK_FORM_ID },
        query: {
          page: 20,
        },
        session: {
          user: {
            _id: MOCK_USER_ID,
          },
        },
      })
      const mockRes = expressHandler.mockResponse()
      // Mock service result.
      const expectedMetadataList = {
        metadata: [
          {
            number: 2,
            refNo: new ObjectId().toHexString(),
            submissionTime: 'some submission time',
          },
        ] as SubmissionMetadata[],
        count: 32,
      }
      MockSubService.getSubmissionMetadataList.mockReturnValueOnce(
        okAsync(expectedMetadataList),
      )

      // Act
      await getMetadata(mockReq, mockRes, jest.fn())

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(expectedMetadataList)
      expect(MockSubService.getSubmissionMetadataList).toHaveBeenCalledWith(
        FormResponseMode.Encrypt,
        MOCK_FORM_ID,
        mockReq.query.page,
      )
      expect(MockSubService.getSubmissionMetadata).not.toHaveBeenCalled()
    })

    it('should return 400 if form is not an encrypt mode form', async () => {
      // Arrange
      const mockSubmissionId = new ObjectId().toHexString()
      const mockReq = expressHandler.mockRequest({
        params: { formId: MOCK_FORM_ID },
        query: {
          submissionId: mockSubmissionId,
        },
        session: {
          user: {
            _id: MOCK_USER_ID,
          },
        },
      })
      const mockRes = expressHandler.mockResponse()

      const expectedError = new ResponseModeError(
        [FormResponseMode.Encrypt, FormResponseMode.Multirespondent],
        FormResponseMode.Email,
      )
      jest
        .spyOn(SubmissionsUtils, 'checkFormIsEncryptModeOrMultirespondent')
        .mockReturnValueOnce(err(expectedError))

      // Act
      await getMetadata(mockReq, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedError.message,
      })
      expect(MockSubService.getSubmissionMetadata).not.toHaveBeenCalled()
      expect(MockSubService.getSubmissionMetadataList).not.toHaveBeenCalled()
    })

    it('should return 403 when user does not have read permissions for form', async () => {
      // Arrange
      const mockSubmissionId = new ObjectId().toHexString()
      const mockReq = expressHandler.mockRequest({
        params: { formId: MOCK_FORM_ID },
        query: {
          submissionId: mockSubmissionId,
        },
        session: {
          user: {
            _id: MOCK_USER_ID,
          },
        },
      })
      const mockRes = expressHandler.mockResponse()

      const expectedError = new ForbiddenFormError('no access')
      MockAuthService.getFormAfterPermissionChecks.mockReturnValueOnce(
        errAsync(expectedError),
      )

      // Act
      await getMetadata(mockReq, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedError.message,
      })
      expect(MockSubService.getSubmissionMetadata).not.toHaveBeenCalled()
      expect(MockSubService.getSubmissionMetadataList).not.toHaveBeenCalled()
    })

    it('should return 404 when form cannot be found', async () => {
      // Arrange
      const mockSubmissionId = new ObjectId().toHexString()
      const mockReq = expressHandler.mockRequest({
        params: { formId: MOCK_FORM_ID },
        query: {
          submissionId: mockSubmissionId,
        },
        session: {
          user: {
            _id: MOCK_USER_ID,
          },
        },
      })
      const mockRes = expressHandler.mockResponse()

      const expectedError = new FormNotFoundError('not found')
      MockAuthService.getFormAfterPermissionChecks.mockReturnValueOnce(
        errAsync(expectedError),
      )

      // Act
      await getMetadata(mockReq, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedError.message,
      })
      expect(MockSubService.getSubmissionMetadata).not.toHaveBeenCalled()
      expect(MockSubService.getSubmissionMetadataList).not.toHaveBeenCalled()
    })

    it('should 410 when form is already archived', async () => {
      // Arrange
      const mockSubmissionId = new ObjectId().toHexString()
      const mockReq = expressHandler.mockRequest({
        params: { formId: MOCK_FORM_ID },
        query: {
          submissionId: mockSubmissionId,
        },
        session: {
          user: {
            _id: MOCK_USER_ID,
          },
        },
      })
      const mockRes = expressHandler.mockResponse()

      const expectedError = new FormDeletedError('already archived')
      MockAuthService.getFormAfterPermissionChecks.mockReturnValueOnce(
        errAsync(expectedError),
      )

      // Act
      await getMetadata(mockReq, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(410)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedError.message,
      })
      expect(MockSubService.getSubmissionMetadata).not.toHaveBeenCalled()
      expect(MockSubService.getSubmissionMetadataList).not.toHaveBeenCalled()
    })

    it('should return 422 when user in session cannot be retrieved', async () => {
      // Arrange
      const mockSubmissionId = new ObjectId().toHexString()
      const mockReq = expressHandler.mockRequest({
        params: { formId: MOCK_FORM_ID },
        query: {
          submissionId: mockSubmissionId,
        },
        session: {
          user: {
            _id: MOCK_USER_ID,
          },
        },
      })
      const mockRes = expressHandler.mockResponse()
      const expectedError = new MissingUserError('user is not found')
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        errAsync(expectedError),
      )

      // Act
      await getMetadata(mockReq, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(422)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedError.message,
      })
      expect(
        MockEncryptSubService.checkFormIsEncryptMode,
      ).not.toHaveBeenCalled()
      expect(
        MockAuthService.getFormAfterPermissionChecks,
      ).not.toHaveBeenCalled()
      expect(MockSubService.getSubmissionMetadata).not.toHaveBeenCalled()
      expect(MockSubService.getSubmissionMetadataList).not.toHaveBeenCalled()
    })

    it('should return 500 when database errors occurs for single metadata retrieval', async () => {
      // Arrange
      const mockSubmissionId = new ObjectId().toHexString()
      const mockReq = expressHandler.mockRequest({
        params: { formId: MOCK_FORM_ID },
        query: {
          submissionId: mockSubmissionId,
        },
        session: {
          user: {
            _id: MOCK_USER_ID,
          },
        },
      })
      const mockErrorString = 'error retrieving metadata'
      const mockRes = expressHandler.mockResponse()
      // Mock service result.
      MockSubService.getSubmissionMetadata.mockReturnValueOnce(
        errAsync(new DatabaseError(mockErrorString)),
      )

      // Act
      await getMetadata(mockReq, mockRes, jest.fn())

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: mockErrorString,
      })
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(MockSubService.getSubmissionMetadataList).not.toHaveBeenCalled()
      expect(MockSubService.getSubmissionMetadata).toHaveBeenCalledWith(
        FormResponseMode.Encrypt,
        MOCK_FORM_ID,
        mockSubmissionId,
      )
    })

    it('should return 500 when database errors occurs for metadata list retrieval', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        params: { formId: MOCK_FORM_ID },
        query: {
          page: 1,
        },
        session: {
          user: {
            _id: MOCK_USER_ID,
          },
        },
      })
      const mockErrorString = 'error retrieving metadata list'
      const mockRes = expressHandler.mockResponse()
      // Mock service result.
      MockSubService.getSubmissionMetadataList.mockReturnValueOnce(
        errAsync(new DatabaseError(mockErrorString)),
      )

      // Act
      await getMetadata(mockReq, mockRes, jest.fn())

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: mockErrorString,
      })
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(MockSubService.getSubmissionMetadata).not.toHaveBeenCalled()
      expect(MockSubService.getSubmissionMetadataList).toHaveBeenCalledWith(
        FormResponseMode.Encrypt,
        MOCK_FORM_ID,
        mockReq.query.page,
      )
    })
  })

  describe('handleGetEncryptedResponse', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()
    const MOCK_USER_ID = new ObjectId().toHexString()

    const MOCK_USER = {
      _id: MOCK_USER_ID,
      email: 'somerandom@example.com',
    } as IPopulatedUser
    const MOCK_FORM = {
      admin: MOCK_USER,
      _id: MOCK_FORM_ID,
      title: 'mock title',
      responseMode: FormResponseMode.Encrypt,
    } as IPopulatedForm

    const MOCK_REQ = expressHandler.mockRequest({
      params: { formId: MOCK_FORM_ID, submissionId: 'mockSubmissionId' },
      session: {
        cookie: {
          maxAge: 20000,
        },
        user: {
          _id: MOCK_USER_ID,
        },
      },
    })

    beforeEach(() => {
      MockUserService.getPopulatedUserById.mockReturnValue(okAsync(MOCK_USER))
      MockAuthService.getFormAfterPermissionChecks.mockReturnValue(
        okAsync(MOCK_FORM),
      )
      jest
        .spyOn(SubmissionsUtils, 'checkFormIsEncryptModeOrMultirespondent')
        .mockReturnValue(ok(MOCK_FORM as IPopulatedEncryptedForm))
    })

    it('should return 200 with encrypted response', async () => {
      // Arrange
      const mockSubData: SubmissionData = {
        _id: 'some id',
        encryptedContent: 'some encrypted content',
        verifiedContent: 'some verified content',
        created: new Date('2020-10-10'),
        paymentId: 'payment id',
        submissionType: SubmissionType.Encrypt,
      } as SubmissionData
      const mockSignedUrls = {
        someKey1: 'some-signed-url',
        someKey2: 'another-signed-url',
      }
      const mockPaymentDetails = {
        paymentIntentId: 'pi_sample_id',
      } as SubmissionPaymentDto
      const mockRes = expressHandler.mockResponse()

      // Mock service responses.
      MockSubService.getEncryptedSubmissionData.mockReturnValueOnce(
        okAsync(mockSubData),
      )
      MockSubService.transformAttachmentMetasToSignedUrls.mockReturnValueOnce(
        okAsync(mockSignedUrls),
      )
      MockSubService.getSubmissionPaymentDto.mockReturnValueOnce(
        okAsync(mockPaymentDetails),
      )

      // Act
      await handleGetEncryptedResponse(MOCK_REQ, mockRes, jest.fn())

      // Assert
      const expected = {
        refNo: mockSubData._id,
        submissionTime: 'Sat, 10 Oct 2020, 08:00:00 AM',
        content: mockSubData.encryptedContent,
        verified: mockSubData.verifiedContent,
        attachmentMetadata: mockSignedUrls,
        payment: mockPaymentDetails,
        submissionType: SubmissionType.Encrypt,
      }
      expect(mockRes.json).toHaveBeenCalledWith(expected)
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(MockAuthService.getFormAfterPermissionChecks).toHaveBeenCalledWith(
        {
          user: MOCK_USER,
          formId: MOCK_FORM_ID,
          level: PermissionLevel.Read,
        },
      )
      expect(
        SubmissionsUtils.checkFormIsEncryptModeOrMultirespondent,
      ).toHaveBeenCalledWith(MOCK_FORM)
    })

    it('should return 400 if form is not an encrypt mode or multirespondent form', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()

      const expectedError = new ResponseModeError(
        [FormResponseMode.Encrypt, FormResponseMode.Multirespondent],
        FormResponseMode.Email,
      )
      jest
        .spyOn(SubmissionsUtils, 'checkFormIsEncryptModeOrMultirespondent')
        .mockReturnValueOnce(err(expectedError))

      // Act
      await handleGetEncryptedResponse(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedError.message,
      })
      expect(MockSubService.getEncryptedSubmissionData).not.toHaveBeenCalled()
    })

    it('should return 403 when user does not have read permissions for form', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()

      const expectedError = new ForbiddenFormError('no access')
      MockAuthService.getFormAfterPermissionChecks.mockReturnValueOnce(
        errAsync(expectedError),
      )

      // Act
      await handleGetEncryptedResponse(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedError.message,
      })
      expect(MockSubService.getEncryptedSubmissionData).not.toHaveBeenCalled()
    })

    it('should return 404 when form cannot be found in the database', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()

      const expectedError = new FormNotFoundError('not found')
      MockAuthService.getFormAfterPermissionChecks.mockReturnValueOnce(
        errAsync(expectedError),
      )

      // Act
      await handleGetEncryptedResponse(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedError.message,
      })
      expect(MockSubService.getEncryptedSubmissionData).not.toHaveBeenCalled()
    })

    it('should return 404 when submissionId cannot be found in the database', async () => {
      // Arrange
      const mockErrorString = 'not found'
      MockSubService.getEncryptedSubmissionData.mockReturnValueOnce(
        errAsync(new SubmissionNotFoundError(mockErrorString)),
      )
      const mockRes = expressHandler.mockResponse()

      // Act
      await handleGetEncryptedResponse(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({ message: mockErrorString })
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(MockAuthService.getFormAfterPermissionChecks).toHaveBeenCalledWith(
        {
          user: MOCK_USER,
          formId: MOCK_FORM_ID,
          level: PermissionLevel.Read,
        },
      )
      expect(
        SubmissionsUtils.checkFormIsEncryptModeOrMultirespondent,
      ).toHaveBeenCalledWith(MOCK_FORM)
    })

    it('should return 410 when form is already archived', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()

      const expectedError = new FormDeletedError('already archived')
      MockAuthService.getFormAfterPermissionChecks.mockReturnValueOnce(
        errAsync(expectedError),
      )

      // Act
      await handleGetEncryptedResponse(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(410)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedError.message,
      })
      expect(MockSubService.getEncryptedSubmissionData).not.toHaveBeenCalled()
    })

    it('should return 422 when user in session cannot be retrieved', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()

      const expectedError = new MissingUserError('user is not found')
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        errAsync(expectedError),
      )

      // Act
      await handleGetEncryptedResponse(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(422)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedError.message,
      })
      expect(
        MockAuthService.getFormAfterPermissionChecks,
      ).not.toHaveBeenCalled()
      expect(MockSubService.getEncryptedSubmissionData).not.toHaveBeenCalled()
    })

    it('should return 500 when database error occurs whilst retrieving submission data', async () => {
      // Arrange
      const mockErrorString = 'database error occurred'
      MockSubService.getEncryptedSubmissionData.mockReturnValueOnce(
        errAsync(new DatabaseError(mockErrorString)),
      )
      const mockRes = expressHandler.mockResponse()

      // Act
      await handleGetEncryptedResponse(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ message: mockErrorString })
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(MockAuthService.getFormAfterPermissionChecks).toHaveBeenCalledWith(
        {
          user: MOCK_USER,
          formId: MOCK_FORM_ID,
          level: PermissionLevel.Read,
        },
      )
      expect(
        SubmissionsUtils.checkFormIsEncryptModeOrMultirespondent,
      ).toHaveBeenCalledWith(MOCK_FORM)
    })

    it('should return 500 when database error occurs whilst retrieving payment data', async () => {
      // Arrange
      const mockErrorString = 'payment error occured'
      MockSubService.getEncryptedSubmissionData.mockReturnValueOnce(
        okAsync({
          paymentId: 'paymentId',
          submissionType: SubmissionType.Encrypt,
        } as SubmissionData),
      )
      MockSubService.transformAttachmentMetasToSignedUrls.mockReturnValueOnce(
        okAsync({}),
      )
      MockSubService.getSubmissionPaymentDto.mockReturnValueOnce(
        errAsync(new DatabaseError(mockErrorString)),
      )

      const mockRes = expressHandler.mockResponse()

      // Act
      await handleGetEncryptedResponse(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: mockErrorString,
      })
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(MockAuthService.getFormAfterPermissionChecks).toHaveBeenCalledWith(
        {
          user: MOCK_USER,
          formId: MOCK_FORM_ID,
          level: PermissionLevel.Read,
        },
      )
      expect(
        SubmissionsUtils.checkFormIsEncryptModeOrMultirespondent,
      ).toHaveBeenCalledWith(MOCK_FORM)
    })

    it('should return 500 when error occurs whilst generating presigned URLs', async () => {
      // Arrange
      const mockErrorString = 'presigned url error occured'
      MockSubService.getEncryptedSubmissionData.mockReturnValueOnce(
        okAsync({} as SubmissionData),
      )
      MockSubService.transformAttachmentMetasToSignedUrls.mockReturnValueOnce(
        errAsync(new CreatePresignedPostError(mockErrorString)),
      )

      const mockRes = expressHandler.mockResponse()

      // Act
      await handleGetEncryptedResponse(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ message: mockErrorString })
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(MockAuthService.getFormAfterPermissionChecks).toHaveBeenCalledWith(
        {
          user: MOCK_USER,
          formId: MOCK_FORM_ID,
          level: PermissionLevel.Read,
        },
      )
      expect(
        SubmissionsUtils.checkFormIsEncryptModeOrMultirespondent,
      ).toHaveBeenCalledWith(MOCK_FORM)
    })

    it('should return 500 when payment was not found for a completed submission', async () => {
      // Arrange
      const mockErrorString = 'payment error occured'
      MockSubService.getEncryptedSubmissionData.mockReturnValueOnce(
        okAsync({
          paymentId: 'paymentId',
          submissionType: SubmissionType.Encrypt,
        } as SubmissionData),
      )
      MockSubService.transformAttachmentMetasToSignedUrls.mockReturnValueOnce(
        okAsync({}),
      )
      MockSubService.getSubmissionPaymentDto.mockReturnValueOnce(
        errAsync(new PaymentNotFoundError(mockErrorString)),
      )

      const mockRes = expressHandler.mockResponse()

      // Act
      await handleGetEncryptedResponse(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: mockErrorString,
      })
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(MockAuthService.getFormAfterPermissionChecks).toHaveBeenCalledWith(
        {
          user: MOCK_USER,
          formId: MOCK_FORM_ID,
          level: PermissionLevel.Read,
        },
      )
      expect(
        SubmissionsUtils.checkFormIsEncryptModeOrMultirespondent,
      ).toHaveBeenCalledWith(MOCK_FORM)
    })
  })

  describe('streamEncryptedResponses', () => {
    const MOCK_USER_ID = new ObjectId().toHexString()
    const MOCK_FORM_ID = new ObjectId().toHexString()
    const MOCK_USER = {
      _id: MOCK_USER_ID,
      email: 'somerandom@example.com',
    } as IPopulatedUser
    const MOCK_FORM = {
      admin: MOCK_USER,
      _id: MOCK_FORM_ID,
      title: 'mock title',
      responseMode: FormResponseMode.Encrypt,
    } as IPopulatedForm

    const MOCK_REQ = expressHandler.mockRequest({
      params: {
        formId: MOCK_FORM_ID,
      },
      session: {
        user: {
          _id: MOCK_USER_ID,
        },
      },
    })

    // Not sure how to test streams in express controllers, so skipping...
    it.todo('should successfully return stream of encrypted responses')

    it('should return 400 if form is not an encrypt mode form', async () => {
      // Arrange
      // Mock success case until form encrypt check
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        okAsync(MOCK_USER),
      )
      MockAuthService.getFormAfterPermissionChecks.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )
      const expectedError = new ResponseModeError(
        FormResponseMode.Encrypt,
        FormResponseMode.Email,
      )
      jest
        .spyOn(SubmissionsUtils, 'checkFormIsEncryptModeOrMultirespondent')
        .mockReturnValueOnce(err(expectedError))

      const mockRes = expressHandler.mockResponse()

      // Act
      await streamEncryptedResponses(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedError.message,
      })
      // Check cursor retrieval not called.
      expect(MockSubService.getSubmissionCursor).not.toHaveBeenCalled()
    })

    it('should return 403 when user does not have read permissions for form', async () => {
      // Arrange
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        okAsync(MOCK_USER),
      )
      const expectedError = new ForbiddenFormError('no access')
      MockAuthService.getFormAfterPermissionChecks.mockReturnValueOnce(
        errAsync(expectedError),
      )
      const mockRes = expressHandler.mockResponse()

      // Act
      await streamEncryptedResponses(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedError.message,
      })
      expect(
        MockEncryptSubService.checkFormIsEncryptMode,
      ).not.toHaveBeenCalled()
      // Check cursor retrieval not called.
      expect(MockSubService.getSubmissionCursor).not.toHaveBeenCalled()
    })

    it('should return 404 when form cannot be found', async () => {
      // Arrange
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        okAsync(MOCK_USER),
      )
      const expectedError = new FormNotFoundError('not found')
      MockAuthService.getFormAfterPermissionChecks.mockReturnValueOnce(
        errAsync(expectedError),
      )
      const mockRes = expressHandler.mockResponse()

      // Act
      await streamEncryptedResponses(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedError.message,
      })
      expect(
        MockEncryptSubService.checkFormIsEncryptMode,
      ).not.toHaveBeenCalled()
      // Check cursor retrieval not called.
      expect(MockSubService.getSubmissionCursor).not.toHaveBeenCalled()
    })

    it('should return 410 when form is already archived', async () => {
      // Arrange
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        okAsync(MOCK_USER),
      )
      const expectedError = new FormDeletedError('already archived')
      MockAuthService.getFormAfterPermissionChecks.mockReturnValueOnce(
        errAsync(expectedError),
      )
      const mockRes = expressHandler.mockResponse()

      // Act
      await streamEncryptedResponses(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(410)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedError.message,
      })
      expect(
        MockEncryptSubService.checkFormIsEncryptMode,
      ).not.toHaveBeenCalled()
      // Check cursor retrieval not called.
      expect(MockSubService.getSubmissionCursor).not.toHaveBeenCalled()
    })

    it('should return 422 when user in session cannot be retrieved', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const expectedError = new MissingUserError('user is not found')
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        errAsync(expectedError),
      )

      // Act
      await streamEncryptedResponses(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(422)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedError.message,
      })
      expect(
        MockEncryptSubService.checkFormIsEncryptMode,
      ).not.toHaveBeenCalled()
      expect(
        MockAuthService.getFormAfterPermissionChecks,
      ).not.toHaveBeenCalled()
      // Check cursor retrieval not called.
      expect(MockSubService.getSubmissionCursor).not.toHaveBeenCalled()
    })

    it('should return 500 when database error occurs whilst retrieving user in session', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const expectedError = new DatabaseError('db went ????????')
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        errAsync(expectedError),
      )

      // Act
      await streamEncryptedResponses(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedError.message,
      })
      expect(
        MockEncryptSubService.checkFormIsEncryptMode,
      ).not.toHaveBeenCalled()
      expect(
        MockAuthService.getFormAfterPermissionChecks,
      ).not.toHaveBeenCalled()
      // Check cursor retrieval not called.
      expect(MockSubService.getSubmissionCursor).not.toHaveBeenCalled()
    })

    it('should return 500 when database error occurs whilst checking form permissions', async () => {
      // Arrange
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        okAsync(MOCK_USER),
      )
      const expectedError = new DatabaseError('database error beep boop')
      MockAuthService.getFormAfterPermissionChecks.mockReturnValueOnce(
        errAsync(expectedError),
      )
      const mockRes = expressHandler.mockResponse()

      // Act
      await streamEncryptedResponses(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedError.message,
      })
      expect(
        MockEncryptSubService.checkFormIsEncryptMode,
      ).not.toHaveBeenCalled()
      // Check cursor retrieval not called.
      expect(MockSubService.getSubmissionCursor).not.toHaveBeenCalled()
    })
  })

  describe('getS3PresignedPostData', () => {
    const MOCK_USER_ID = new ObjectId().toHexString()
    const MOCK_FORM_ID = new ObjectId().toHexString()

    const MOCK_REQ = expressHandler.mockRequest({
      params: {
        formId: MOCK_FORM_ID,
      },
      session: {
        user: {
          _id: MOCK_USER_ID,
        },
      },
      body: [
        { id: new ObjectId().toHexString(), size: 500 },
      ] as unknown as AttachmentSizeMapType[],
    })

    it('should return 500 if getFeatureFlag returns errAsync(DatabaseError)', async () => {
      // Arrange
      MockFeatureFlagService.getFeatureFlag.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )
      const mockRes = expressHandler.mockResponse()

      // Act
      await getS3PresignedPostData(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
    })

    it('should return 400 if getFeatureFlag returns okAsync(false)', async () => {
      // Arrange
      MockFeatureFlagService.getFeatureFlag.mockReturnValueOnce(okAsync(false))
      const mockRes = expressHandler.mockResponse()

      // Act
      await getS3PresignedPostData(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN)
    })

    it('should return 500 if getFeatureFlag returns okAsync(true) but getQuarantinePresignedPostData returns errAsync(CreatePresignedPostError)', async () => {
      // Arrange
      MockFeatureFlagService.getFeatureFlag.mockReturnValueOnce(okAsync(true))
      MockSubService.getQuarantinePresignedPostData.mockReturnValueOnce(
        errAsync(new CreatePresignedPostError()),
      )
      const mockRes = expressHandler.mockResponse()

      // Act
      await getS3PresignedPostData(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
    })

    it('should return 200 if getFeatureFlag returns okAsync(true) and getQuarantinePresignedPostData returns okAsync with the presigned URLs', async () => {
      // Arrange
      MockFeatureFlagService.getFeatureFlag.mockReturnValueOnce(okAsync(true))
      const MOCK_PRESIGNED_URLS = [
        { key: 'value' },
      ] as unknown as AttachmentPresignedPostDataMapType[]

      MockSubService.getQuarantinePresignedPostData.mockReturnValueOnce(
        okAsync(MOCK_PRESIGNED_URLS),
      )
      const mockRes = expressHandler.mockResponse()

      // Act
      await getS3PresignedPostData(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(mockRes.send).toHaveBeenCalledWith(MOCK_PRESIGNED_URLS)
    })
  })
})
