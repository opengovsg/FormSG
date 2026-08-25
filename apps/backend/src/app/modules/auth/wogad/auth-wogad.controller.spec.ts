import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { StatusCodes } from 'http-status-codes'
import { errAsync, okAsync } from 'neverthrow'

import { AgencyDocument, IPopulatedUser } from 'src/types'

import * as UserService from '../../user/user.service'
import { InvalidDomainError } from '../auth.errors'
import * as AuthService from '../auth.service'

import * as AuthWogadController from './auth-wogad.controller'

const MockAuthService = jest.mocked(AuthService)
const MockUserService = jest.mocked(UserService)

jest.mock('@azure/msal-node', () => {
  const mockGetAuthCodeUrl = jest.fn().mockResolvedValue('MOCK_AUTH_URL')
  const mockAcquireTokenByCode = jest.fn().mockResolvedValue({
    account: {
      username: 'MOCK_USER_EMAIL',
    },
  })
  const mockRemoveAccount = jest.fn()

  // The controller narrows caught errors with `error instanceof AuthError`.
  // Without this export the mock leaves AuthError undefined, and the catch
  // block throws `Right-hand side of 'instanceof' is not an object` before it
  // can log or respond.
  class MockAuthError extends Error {
    constructor(
      public errorCode?: string,
      public errorMessage?: string,
    ) {
      super(errorMessage)
    }
  }

  return {
    AuthError: MockAuthError,
    ConfidentialClientApplication: jest.fn().mockImplementation(() => ({
      getAuthCodeUrl: mockGetAuthCodeUrl,
      acquireTokenByCode: mockAcquireTokenByCode,
      getTokenCache: jest.fn().mockReturnValue({
        removeAccount: mockRemoveAccount,
      }),
    })),
    msalMocks: {
      getAuthCodeUrl: mockGetAuthCodeUrl,
      acquireTokenByCode: mockAcquireTokenByCode,
      removeAccount: mockRemoveAccount,
    },
  }
})

const MOCK_AUTH_URL = 'MOCK_AUTH_URL'
const MOCK_CODE_VERIFIER = 'MOCK_CODE_VERIFIER'

const msalMocks = jest.requireMock('@azure/msal-node').msalMocks

describe('AuthWogadController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateAuthUrl', () => {
    it('should include csrf token in response cookie', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest()
      const mockRes = expressHandler.mockResponse()
      // Act
      await AuthWogadController.generateAuthUrlForTest(
        mockReq,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'csrf_token',
        expect.stringMatching(/^[a-f0-9]{64}$/i),
        expect.any(Object),
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(mockRes.json).toHaveBeenCalledWith({
        authUrl: MOCK_AUTH_URL,
        csrfToken: expect.stringMatching(/^[a-f0-9]{64}$/i),
      })
    })
  })

  describe('handleVerifyWithCode', () => {
    const csrfTokenA =
      '1234567812345678123456781234567812345678123456781234567812345678'
    const csrfTokenB =
      '8765432187654321876543218765432187654321876543218765432187654321'
    it('should return 200 with user id and grant wogad grant source in session if authentication is successful and user email is whitelisted', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        body: {
          code: 'MOCK_AUTH_CODE',
          csrfToken: csrfTokenA,
        },
        cookies: {
          csrf_token: csrfTokenA,
        },
      })
      const mockRes = expressHandler.mockResponse()
      MockAuthService.validateEmailDomain = jest
        .fn()
        .mockReturnValue(okAsync(<AgencyDocument>{ _id: 'MOCK_AGENCY_ID' }))
      MockUserService.retrieveUser = jest.fn().mockReturnValueOnce(
        okAsync(<IPopulatedUser>{
          _id: 'MOCK_USER_ID',
        }),
      )
      // Act
      await AuthWogadController.handleVerifyWithCodeForTest(
        mockReq,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(mockRes.json).toHaveBeenCalledWith({
        _id: 'MOCK_USER_ID',
      })
    })

    it('should pass the code verifier from the cookie to the token request', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        body: {
          code: 'MOCK_AUTH_CODE',
          csrfToken: csrfTokenA,
        },
        cookies: {
          csrf_token: csrfTokenA,
          [AuthWogadController.WOGAD_CODE_VERIFIER_COOKIE_NAME]:
            MOCK_CODE_VERIFIER,
        },
      })
      const mockRes = expressHandler.mockResponse()
      MockAuthService.validateEmailDomain = jest
        .fn()
        .mockReturnValue(okAsync(<AgencyDocument>{ _id: 'MOCK_AGENCY_ID' }))
      MockUserService.retrieveUser = jest.fn().mockReturnValueOnce(
        okAsync(<IPopulatedUser>{
          _id: 'MOCK_USER_ID',
        }),
      )
      // Act
      await AuthWogadController.handleVerifyWithCodeForTest(
        mockReq,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(msalMocks.acquireTokenByCode).toHaveBeenCalledWith(
        expect.objectContaining({ codeVerifier: MOCK_CODE_VERIFIER }),
      )
    })

    it('should clear both auth cookies after a successful verification', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        body: {
          code: 'MOCK_AUTH_CODE',
          csrfToken: csrfTokenA,
        },
        cookies: {
          csrf_token: csrfTokenA,
          [AuthWogadController.WOGAD_CODE_VERIFIER_COOKIE_NAME]:
            MOCK_CODE_VERIFIER,
        },
      })
      const mockRes = expressHandler.mockResponse()
      MockAuthService.validateEmailDomain = jest
        .fn()
        .mockReturnValue(okAsync(<AgencyDocument>{ _id: 'MOCK_AGENCY_ID' }))
      MockUserService.retrieveUser = jest.fn().mockReturnValueOnce(
        okAsync(<IPopulatedUser>{
          _id: 'MOCK_USER_ID',
        }),
      )
      // Act
      await AuthWogadController.handleVerifyWithCodeForTest(
        mockReq,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        AuthWogadController.WOGAD_CODE_VERIFIER_COOKIE_NAME,
      )
      expect(mockRes.clearCookie).toHaveBeenCalledWith('csrf_token')
    })

    it('should clear both auth cookies when the token exchange fails', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        body: {
          code: 'MOCK_AUTH_CODE',
          csrfToken: csrfTokenA,
        },
        cookies: {
          csrf_token: csrfTokenA,
          [AuthWogadController.WOGAD_CODE_VERIFIER_COOKIE_NAME]:
            MOCK_CODE_VERIFIER,
        },
      })
      const mockRes = expressHandler.mockResponse()
      msalMocks.acquireTokenByCode.mockRejectedValueOnce(
        new Error('MOCK_TOKEN_FAILURE'),
      )
      // Act
      await AuthWogadController.handleVerifyWithCodeForTest(
        mockReq,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN)
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        AuthWogadController.WOGAD_CODE_VERIFIER_COOKIE_NAME,
      )
      expect(mockRes.clearCookie).toHaveBeenCalledWith('csrf_token')
    })

    // Guards the rolling-deploy window: a login started by an instance that
    // predates PKCE has no verifier cookie and no code_challenge bound at the
    // IdP, so the exchange must still be attempted rather than rejected here.
    it('should still attempt the token exchange when the verifier cookie is absent', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        body: {
          code: 'MOCK_AUTH_CODE',
          csrfToken: csrfTokenA,
        },
        cookies: {
          csrf_token: csrfTokenA,
        },
      })
      const mockRes = expressHandler.mockResponse()
      MockAuthService.validateEmailDomain = jest
        .fn()
        .mockReturnValue(okAsync(<AgencyDocument>{ _id: 'MOCK_AGENCY_ID' }))
      MockUserService.retrieveUser = jest.fn().mockReturnValueOnce(
        okAsync(<IPopulatedUser>{
          _id: 'MOCK_USER_ID',
        }),
      )
      // Act
      await AuthWogadController.handleVerifyWithCodeForTest(
        mockReq,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(msalMocks.acquireTokenByCode).toHaveBeenCalledWith(
        expect.objectContaining({ codeVerifier: undefined }),
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
    })

    it('should return 403 when csrf token mismatch', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        body: {
          code: 'MOCK_AUTH_CODE',
          csrfToken: csrfTokenA,
        },
        cookies: {
          csrf_token: csrfTokenB,
        },
      })
      const mockRes = expressHandler.mockResponse()
      // Act
      await AuthWogadController.handleVerifyWithCodeForTest(
        mockReq,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'CSRF token mismatch',
      })
    })

    it('should return 403 when csrf token from client is not provided', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        body: {
          code: 'MOCK_AUTH_CODE',
          csrfToken: csrfTokenB,
        },
        cookies: {},
      })
      const mockRes = expressHandler.mockResponse()
      // Act
      await AuthWogadController.handleVerifyWithCodeForTest(
        mockReq,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'CSRF token mismatch',
      })
    })

    it('should return 403 when csrf token (state) not provided by idp provider', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        body: {
          code: 'MOCK_AUTH_CODE',
        } as unknown as { code: string; csrfToken: string },
        cookies: {
          csrf_token: csrfTokenA,
        },
      })
      const mockRes = expressHandler.mockResponse()
      // Act
      await AuthWogadController.handleVerifyWithCodeForTest(
        mockReq,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'CSRF token mismatch',
      })
    })

    it('should return 404 when user email does not exist', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        body: {
          code: 'MOCK_AUTH_CODE',
          csrfToken: csrfTokenA,
        },
        cookies: {
          csrf_token: csrfTokenA,
        },
      })
      const mockRes = expressHandler.mockResponse()
      msalMocks.acquireTokenByCode.mockResolvedValueOnce({
        account: null,
      })
      // Act
      await AuthWogadController.handleVerifyWithCodeForTest(
        mockReq,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'WOG AD user is not found',
      })
    })

    it('should return 403 if user email is not whitelisted', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        body: {
          code: 'MOCK_AUTH_CODE',
          csrfToken: csrfTokenA,
        },
        cookies: {
          csrf_token: csrfTokenA,
        },
      })
      const mockRes = expressHandler.mockResponse()
      MockAuthService.validateEmailDomain = jest
        .fn()
        .mockReturnValue(errAsync(new InvalidDomainError()))

      // Act
      await AuthWogadController.handleVerifyWithCodeForTest(
        mockReq,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'WOG AD user is not whitelisted',
      })
    })
  })
})
