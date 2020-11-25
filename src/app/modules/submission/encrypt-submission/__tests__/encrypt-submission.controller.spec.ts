import { ObjectId } from 'bson-ext'
import { errAsync, okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import { DatabaseError } from 'src/app/modules/core/core.errors'
import { CreatePresignedUrlError } from 'src/app/modules/form/admin-form/admin-form.errors'
import { SubmissionData, SubmissionMetadata } from 'src/types'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { SubmissionNotFoundError } from '../../submission.errors'
import {
  handleGetEncryptedResponse,
  handleGetMetadata,
} from '../encrypt-submission.controller'
import * as EncryptSubmissionService from '../encrypt-submission.service'

jest.mock('../encrypt-submission.service')
const MockEncryptSubService = mocked(EncryptSubmissionService)

describe('encrypt-submission.controller', () => {
  beforeEach(() => jest.clearAllMocks())

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

  describe('handleGetMetadata', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()

    it('should return 200 with single submission metadata when query.submissionId is provided and can be found', async () => {
      // Arrange
      const mockSubmissionId = new ObjectId().toHexString()
      const mockReq = expressHandler.mockRequest({
        params: { formId: MOCK_FORM_ID },
        query: {
          submissionId: mockSubmissionId,
        },
      })
      const mockRes = expressHandler.mockResponse()
      // Mock service result.
      const expectedMetadata: SubmissionMetadata = {
        number: 2,
        refNo: mockSubmissionId,
        submissionTime: 'some submission time',
      }

      MockEncryptSubService.getSubmissionMetadata.mockReturnValueOnce(
        okAsync(expectedMetadata),
      )

      // Act
      await handleGetMetadata(mockReq, mockRes, jest.fn())

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        metadata: [expectedMetadata],
        count: 1,
      })
      expect(
        MockEncryptSubService.getSubmissionMetadataList,
      ).not.toHaveBeenCalled()
      expect(MockEncryptSubService.getSubmissionMetadata).toHaveBeenCalledWith(
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
      })
      const mockRes = expressHandler.mockResponse()
      // Mock service result.
      MockEncryptSubService.getSubmissionMetadata.mockReturnValueOnce(
        okAsync(null),
      )

      // Act
      await handleGetMetadata(mockReq, mockRes, jest.fn())

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        metadata: [],
        count: 0,
      })
      expect(
        MockEncryptSubService.getSubmissionMetadataList,
      ).not.toHaveBeenCalled()
      expect(MockEncryptSubService.getSubmissionMetadata).toHaveBeenCalledWith(
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

      MockEncryptSubService.getSubmissionMetadataList.mockReturnValueOnce(
        okAsync(expectedMetadataList),
      )

      // Act
      await handleGetMetadata(mockReq, mockRes, jest.fn())

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(expectedMetadataList)
      expect(
        MockEncryptSubService.getSubmissionMetadataList,
      ).toHaveBeenCalledWith(MOCK_FORM_ID, mockReq.query.page)
      expect(MockEncryptSubService.getSubmissionMetadata).not.toHaveBeenCalled()
    })

    it('should return 500 when database errors occurs for single metadata retrieval', async () => {
      // Arrange
      const mockSubmissionId = new ObjectId().toHexString()
      const mockReq = expressHandler.mockRequest({
        params: { formId: MOCK_FORM_ID },
        query: {
          submissionId: mockSubmissionId,
        },
      })
      const mockErrorString = 'error retrieving metadata'
      const mockRes = expressHandler.mockResponse()
      // Mock service result.
      MockEncryptSubService.getSubmissionMetadata.mockReturnValueOnce(
        errAsync(new DatabaseError(mockErrorString)),
      )

      // Act
      await handleGetMetadata(mockReq, mockRes, jest.fn())

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: mockErrorString,
      })
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(
        MockEncryptSubService.getSubmissionMetadataList,
      ).not.toHaveBeenCalled()
      expect(MockEncryptSubService.getSubmissionMetadata).toHaveBeenCalledWith(
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
      })
      const mockErrorString = 'error retrieving metadata list'
      const mockRes = expressHandler.mockResponse()
      // Mock service result.
      MockEncryptSubService.getSubmissionMetadataList.mockReturnValueOnce(
        errAsync(new DatabaseError(mockErrorString)),
      )

      // Act
      await handleGetMetadata(mockReq, mockRes, jest.fn())

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: mockErrorString,
      })
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(MockEncryptSubService.getSubmissionMetadata).not.toHaveBeenCalled()
      expect(
        MockEncryptSubService.getSubmissionMetadataList,
      ).toHaveBeenCalledWith(MOCK_FORM_ID, mockReq.query.page)
    })
  })
})
