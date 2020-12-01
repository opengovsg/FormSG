import { errAsync, okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import { DatabaseError } from 'src/app/modules/core/core.errors'
import { CreatePresignedUrlError } from 'src/app/modules/form/admin-form/admin-form.errors'
import { SubmissionData } from 'src/types'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { SubmissionNotFoundError } from '../../submission.errors'
import { handleGetEncryptedResponse } from '../encrypt-submission.controller'
import * as EncryptSubmissionService from '../encrypt-submission.service'

jest.mock('../encrypt-submission.service')
const MockEncryptSubService = mocked(EncryptSubmissionService)

describe('encrypt-submission.controller', () => {
  describe('handleGetEncryptedResponse', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      params: { formId: 'mockFormId' },
      query: { submissionId: 'mockSubmissionId' },
      session: {
        cookie: {
          maxAge: 20000,
        },
      },
    })

    it('should return 200 with encrypted response', async () => {
      // Arrange
      const mockSubData: SubmissionData = {
        _id: 'some id',
        encryptedContent: 'some encrypted content',
        verifiedContent: 'some verified content',
        created: new Date('2020-10-10'),
      } as SubmissionData
      const mockSignedUrls = {
        someKey1: 'some-signed-url',
        someKey2: 'another-signed-url',
      }
      const mockRes = expressHandler.mockResponse()

      // Mock service responses.
      MockEncryptSubService.getEncryptedSubmissionData.mockReturnValueOnce(
        okAsync(mockSubData),
      )
      MockEncryptSubService.transformAttachmentMetasToSignedUrls.mockReturnValueOnce(
        okAsync(mockSignedUrls),
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
      }
      expect(mockRes.json).toHaveBeenCalledWith(expected)
    })

    it('should return 404 when submissionId cannot be found in the database', async () => {
      // Arrange
      const mockErrorString = 'not found'
      MockEncryptSubService.getEncryptedSubmissionData.mockReturnValueOnce(
        errAsync(new SubmissionNotFoundError(mockErrorString)),
      )
      const mockRes = expressHandler.mockResponse()

      // Act
      await handleGetEncryptedResponse(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({ message: mockErrorString })
    })

    it('should return 500 when database error occurs', async () => {
      // Arrange
      const mockErrorString = 'database error occurred'
      MockEncryptSubService.getEncryptedSubmissionData.mockReturnValueOnce(
        errAsync(new DatabaseError(mockErrorString)),
      )
      const mockRes = expressHandler.mockResponse()

      // Act
      await handleGetEncryptedResponse(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ message: mockErrorString })
    })

    it('should return 500 when error occurs when generating presigned URLs', async () => {
      // Arrange
      const mockErrorString = 'presigned url error occured'
      MockEncryptSubService.getEncryptedSubmissionData.mockReturnValueOnce(
        okAsync({} as SubmissionData),
      )
      MockEncryptSubService.transformAttachmentMetasToSignedUrls.mockReturnValueOnce(
        errAsync(new CreatePresignedUrlError(mockErrorString)),
      )

      const mockRes = expressHandler.mockResponse()

      // Act
      await handleGetEncryptedResponse(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ message: mockErrorString })
    })
  })
})
