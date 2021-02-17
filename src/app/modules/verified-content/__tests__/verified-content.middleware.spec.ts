import { err, ok } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import { FeatureNames } from 'src/config/feature-manager'
import { AuthType, ResponseMode } from 'src/types'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { MissingFeatureError } from '../../core/core.errors'
import { MalformedVerifiedContentError } from '../verified-content.errors'
import { VerifiedContentFactory } from '../verified-content.factory'
import { encryptVerifiedSpcpFields } from '../verified-content.middlewares'
import { CpVerifiedContent } from '../verified-content.types'

jest.mock('../verified-content.factory')

const MockedVerifiedContentFactory = mocked(VerifiedContentFactory)

describe('verified-content.middlewares', () => {
  describe('encryptVerifiedSpcpFields', () => {
    beforeEach(() => jest.clearAllMocks())

    it('should call next with res.locals.verified assigned on success', async () => {
      // Arrange
      const mockReq = Object.assign(expressHandler.mockRequest(), {
        form: {
          authType: AuthType.SP,
          responseMode: ResponseMode.Encrypt,
          publicKey: 'some public key',
        },
      })
      const mockRes = expressHandler.mockResponse({
        locals: { someKey: 'some mock data' },
      })
      const mockVerifiedContent: CpVerifiedContent = {
        cpUen: 'some uen',
        cpUid: 'some uid',
      }
      const expectedEncryptedContent = 'some encrypted content'
      const mockNext = jest.fn()
      MockedVerifiedContentFactory.getVerifiedContent.mockReturnValueOnce(
        ok(mockVerifiedContent),
      )
      MockedVerifiedContentFactory.encryptVerifiedContent.mockReturnValueOnce(
        ok(expectedEncryptedContent),
      )

      // Act
      await encryptVerifiedSpcpFields(mockReq, mockRes, mockNext)

      // Assert
      expect(mockRes.locals.verified).toEqual(expectedEncryptedContent)
      expect(mockNext).toBeCalled()
      expect(
        MockedVerifiedContentFactory.getVerifiedContent,
      ).toHaveBeenCalledWith({
        type: mockReq.form.authType,
        data: mockRes.locals,
      })
      expect(
        MockedVerifiedContentFactory.encryptVerifiedContent,
      ).toHaveBeenCalledWith({
        verifiedContent: mockVerifiedContent,
        formPublicKey: mockReq.form.publicKey,
      })
      expect(mockRes.status).not.toHaveBeenCalled()
      expect(mockRes.json).not.toHaveBeenCalled()
    })

    it('should return early if form is not SP/CP enabled', async () => {
      // Arrange
      const mockReq = Object.assign(expressHandler.mockRequest(), {
        form: { authType: AuthType.NIL },
      })
      const mockRes = expressHandler.mockResponse()
      const mockNext = jest.fn()

      // Act
      await encryptVerifiedSpcpFields(mockReq, mockRes, mockNext)

      // Assert
      expect(mockNext).toBeCalled()
      expect(mockRes.status).not.toBeCalled()
      expect(mockRes.json).not.toBeCalled()
      // Should not reach this step.
      expect(
        MockedVerifiedContentFactory.getVerifiedContent,
      ).not.toHaveBeenCalled()
      expect(
        MockedVerifiedContentFactory.encryptVerifiedContent,
      ).not.toHaveBeenCalled()
    })

    it('should return 422 if form is not encrypt mode', async () => {
      // Arrange
      const mockReq = Object.assign(expressHandler.mockRequest(), {
        // SP form, but email mode form.
        form: { authType: AuthType.SP, responseMode: ResponseMode.Email },
      })
      const mockRes = expressHandler.mockResponse()
      const mockNext = jest.fn()

      // Act
      await encryptVerifiedSpcpFields(mockReq, mockRes, mockNext)

      // Assert
      expect(mockNext).not.toBeCalled()
      expect(mockRes.status).toHaveBeenCalledWith(422)
      expect(mockRes.json).toHaveBeenCalledWith({
        message:
          'Unable to encrypt verified SPCP fields on non storage mode forms',
      })
      // Should not reach this step.
      expect(
        MockedVerifiedContentFactory.getVerifiedContent,
      ).not.toHaveBeenCalled()
      expect(
        MockedVerifiedContentFactory.encryptVerifiedContent,
      ).not.toHaveBeenCalled()
    })

    it('should silently passthrough if verified content feature is not activated', async () => {
      // Arrange
      const mockReq = Object.assign(expressHandler.mockRequest(), {
        form: { authType: AuthType.SP, responseMode: ResponseMode.Encrypt },
      })
      const mockRes = expressHandler.mockResponse({
        locals: 'some mock data',
      })
      const mockNext = jest.fn()
      MockedVerifiedContentFactory.getVerifiedContent.mockReturnValueOnce(
        err(new MissingFeatureError(FeatureNames.WebhookVerifiedContent)),
      )

      // Act
      await encryptVerifiedSpcpFields(mockReq, mockRes, mockNext)

      // Assert
      expect(mockNext).toBeCalled()
      expect(
        MockedVerifiedContentFactory.getVerifiedContent,
      ).toHaveBeenCalledWith({
        type: mockReq.form.authType,
        data: mockRes.locals,
      })
      expect(mockRes.status).not.toHaveBeenCalled()
      expect(mockRes.json).not.toHaveBeenCalled()
      expect(
        MockedVerifiedContentFactory.encryptVerifiedContent,
      ).not.toHaveBeenCalled()
    })

    it('should return 400 if verified content is malformed', async () => {
      // Arrange
      const mockReq = Object.assign(expressHandler.mockRequest(), {
        form: {
          authType: AuthType.SP,
          responseMode: ResponseMode.Encrypt,
          publicKey: 'some public key',
        },
      })
      const mockRes = expressHandler.mockResponse({
        locals: 'some mock data',
      })
      const mockVerifiedContent: CpVerifiedContent = {
        cpUen: 'some uen',
        cpUid: 'some uid',
      }
      const mockNext = jest.fn()
      MockedVerifiedContentFactory.getVerifiedContent.mockReturnValueOnce(
        ok(mockVerifiedContent),
      )
      MockedVerifiedContentFactory.encryptVerifiedContent.mockReturnValueOnce(
        err(new MalformedVerifiedContentError()),
      )

      // Act
      await encryptVerifiedSpcpFields(mockReq, mockRes, mockNext)

      // Assert
      expect(mockNext).not.toBeCalled()
      expect(
        MockedVerifiedContentFactory.getVerifiedContent,
      ).toHaveBeenCalledWith({
        type: mockReq.form.authType,
        data: mockRes.locals,
      })
      expect(
        MockedVerifiedContentFactory.encryptVerifiedContent,
      ).toHaveBeenCalledWith({
        verifiedContent: mockVerifiedContent,
        formPublicKey: mockReq.form.publicKey,
      })
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid data was found. Please submit again.',
      })
    })
  })
})
