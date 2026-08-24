import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import crypto from 'crypto'
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

  const getVerifierCookieCall = (
    mockRes: ReturnType<typeof expressHandler.mockResponse>,
  ) =>
    jest
      .mocked(mockRes.cookie)
      .mock.calls.find(([name]) => name === 'wogadCodeVerifier') as unknown as
      | [string, string, Record<string, unknown>]
      | undefined

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
        AuthWogadController.WOGAD_CSRF_TOKEN_COOKIE_NAME,
        expect.stringMatching(/^[a-f0-9]{64}$/i),
        AuthWogadController.WOGAD_AUTH_COOKIE_OPTIONS,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(mockRes.json).toHaveBeenCalledWith({
        authUrl: MOCK_AUTH_URL,
        csrfToken: expect.stringMatching(/^[a-f0-9]{64}$/i),
      })
    })

    it('should send an S256 challenge derived from the stored verifier', async () => {
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
      const verifier = getVerifierCookieCall(mockRes)?.[1]
      const [authCodeUrlParams] = jest.mocked(msalMocks.getAuthCodeUrl).mock
        .calls[0] as unknown as [Record<string, unknown>]

      // The challenge must actually be SHA256(verifier), not merely present -
      // an unrelated pair would sail past a presence check and fail only at
      // the IdP, in production.
      expect(authCodeUrlParams.codeChallenge).toBe(
        crypto
          .createHash('sha256')
          .update(verifier as string)
          .digest('base64url'),
      )
      expect(authCodeUrlParams.codeChallengeMethod).toBe('S256')
    })

    it('should store the code verifier in a session-scoped httpOnly cookie', async () => {
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
      const verifierCookieCall = getVerifierCookieCall(mockRes)
      expect(verifierCookieCall).toBeDefined()

      const [, value, options] = verifierCookieCall as [
        string,
        string,
        Record<string, unknown>,
      ]
      // 32 octets base64url-encoded, per RFC 7636 section 4.1.
      expect(value).toMatch(/^[A-Za-z0-9_-]{43}$/)
      expect(options).toMatchObject({ httpOnly: true })
      // A lifetime shorter than the user's journey through the IdP would strand
      // a valid auth code with no verifier, so this stays a session cookie.
      expect(options).not.toHaveProperty('maxAge')
      expect(options).not.toHaveProperty('expires')
    })

    it('should never return the code verifier in the response body', async () => {
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
      // Asserted against the serialised payload rather than a named key: the
      // verifier reaching the browser defeats PKCE regardless of what it is
      // called, so renaming a field must not be able to slip past this.
      const verifier = getVerifierCookieCall(mockRes)?.[1]
      const [payload] = jest.mocked(mockRes.json).mock.calls[0]
      expect(verifier).toBeDefined()
      expect(JSON.stringify(payload)).not.toContain(verifier)
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
        AuthWogadController.WOGAD_AUTH_COOKIE_OPTIONS,
      )
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        AuthWogadController.WOGAD_CSRF_TOKEN_COOKIE_NAME,
        AuthWogadController.WOGAD_AUTH_COOKIE_OPTIONS,
      )
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
        AuthWogadController.WOGAD_AUTH_COOKIE_OPTIONS,
      )
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        AuthWogadController.WOGAD_CSRF_TOKEN_COOKIE_NAME,
        AuthWogadController.WOGAD_AUTH_COOKIE_OPTIONS,
      )
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
