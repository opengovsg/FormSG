import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { StatusCodes } from 'http-status-codes'
import { errAsync, okAsync } from 'neverthrow'

import {
  SSO_CODE_VERIFIER_COOKIE_NAME,
  SSO_NONCE_NAME,
} from './auth-sso.constants'
import * as AuthSsoController from './auth-sso.controller'
import { SsoCreateRedirectUrlError } from './auth-sso.errors'
import { AuthSsoService } from './auth-sso.service'

const mockChainableResponse = () =>
  expressHandler.mockResponse({
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  })

describe('AuthSsoController', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  describe('login', () => {
    it('should return 200 with redirect url and set auth cookies', async () => {
      // Arrange
      jest.spyOn(AuthSsoService, 'createRedirectUrl').mockReturnValueOnce(
        okAsync({
          redirectUrl: 'MOCK_REDIRECT_URL',
          codeVerifier: 'MOCK_CODE_VERIFIER',
          nonce: 'MOCK_NONCE',
        }),
      )
      const mockReq = expressHandler.mockRequest()
      const mockRes = mockChainableResponse()
      // Act
      await AuthSsoController.login(mockReq, mockRes, jest.fn())
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(mockRes.cookie).toHaveBeenCalledWith(
        SSO_CODE_VERIFIER_COOKIE_NAME,
        'MOCK_CODE_VERIFIER',
      )
      expect(mockRes.cookie).toHaveBeenCalledWith(SSO_NONCE_NAME, 'MOCK_NONCE')
      expect(mockRes.send).toHaveBeenCalledWith({
        redirectUrl: 'MOCK_REDIRECT_URL',
      })
    })

    it('should return 500 and clear the code verifier cookie before sending the body when redirect url generation fails', async () => {
      // Arrange
      jest
        .spyOn(AuthSsoService, 'createRedirectUrl')
        .mockReturnValueOnce(errAsync(new SsoCreateRedirectUrlError()))
      const mockReq = expressHandler.mockRequest()
      const mockRes = mockChainableResponse()
      // Act
      await AuthSsoController.login(mockReq, mockRes, jest.fn())
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        SSO_CODE_VERIFIER_COOKIE_NAME,
      )
      expect(mockRes.json).toHaveBeenCalledWith({
        message:
          'Generating SSO authentication url failed. Please try again later.',
      })
      const [clearCookieOrder] = jest.mocked(mockRes.clearCookie).mock
        .invocationCallOrder
      const [jsonOrder] = jest.mocked(mockRes.json).mock.invocationCallOrder
      expect(clearCookieOrder).toBeLessThan(jsonOrder)
    })
  })
})
