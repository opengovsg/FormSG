import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { ObjectId } from 'bson-ext'
import { StatusCodes } from 'http-status-codes'
import { errAsync, okAsync } from 'neverthrow'

import { DatabaseError } from 'src/app/modules/core/core.errors'
import * as FeatureFlagService from 'src/app/modules/feature-flags/feature-flags.service'
import { CreatePresignedPostError } from 'src/app/utils/aws-s3'

import {
  AttachmentPresignedPostDataMapType,
  AttachmentSizeMapType,
} from '../../../../../../shared/types'
import { getS3PresignedPostData } from '../encrypt-submission.controller'
import * as EncryptSubmissionService from '../encrypt-submission.service'

jest.mock(
  'src/app/modules/submission/encrypt-submission/encrypt-submission.service',
)
jest.mock('src/app/modules/feature-flags/feature-flags.service')
const MockEncryptSubService = jest.mocked(EncryptSubmissionService)
const MockFeatureFlagService = jest.mocked(FeatureFlagService)

describe('encrypt-submission.controller', () => {
  beforeEach(() => jest.clearAllMocks())

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
      MockEncryptSubService.getQuarantinePresignedPostData.mockReturnValueOnce(
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

      MockEncryptSubService.getQuarantinePresignedPostData.mockReturnValueOnce(
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
