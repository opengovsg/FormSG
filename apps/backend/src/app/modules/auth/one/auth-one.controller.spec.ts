import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { StatusCodes } from 'http-status-codes'
import { errAsync, ok, okAsync } from 'neverthrow'
import * as oidcClient from 'openid-client'

import { AgencyDocument, IPopulatedUser } from 'src/types'

import * as UserService from '../../user/user.service'
import * as AuthService from '../auth.service'

import {
  ONE_CODE_VERIFIER_COOKIE_NAME,
  ONE_NONCE_COOKIE_NAME,
  ONE_STATE_COOKIE_NAME,
  ONE_USER_DOMAIN_WHITELIST,
} from './auth-one.constants'
import * as AuthOneController from './auth-one.controller'
import { OneCreateRedirectUrlError } from './auth-one.errors'
import { AuthOneService } from './auth-one.service'

jest.mock('./auth-one.service')
jest.mock('../auth.service')
jest.mock('../../user/user.service')

const MockAuthOneService = jest.mocked(AuthOneService)
const MockAuthService = jest.mocked(AuthService)
const MockUserService = jest.mocked(UserService)

const MOCK_ISSUER = 'https://one.example.com/api/auth'
const MOCK_REDIRECT_URL = `${MOCK_ISSUER}/authorize?client_id=abc`
const MOCK_REDIRECT = {
  redirectUrl: MOCK_REDIRECT_URL,
  codeVerifier: 'mock-verifier',
  state: 'mock-state',
  nonce: 'mock-nonce',
}
const MOCK_TOKENS = {
  access_token: 'access',
  id_token: 'id',
} as unknown as oidcClient.TokenEndpointResponse &
  oidcClient.TokenEndpointResponseHelpers
const MOCK_WHITELISTED_EMAIL = `user@${ONE_USER_DOMAIN_WHITELIST[0]}`
const MOCK_CLAIMS = {
  sub: MOCK_WHITELISTED_EMAIL,
  email: MOCK_WHITELISTED_EMAIL,
  sid: 'mock-sid',
}

const MOCK_CALLBACK_COOKIES = {
  [ONE_CODE_VERIFIER_COOKIE_NAME]: 'mock-verifier',
  [ONE_STATE_COOKIE_NAME]: 'mock-state',
  [ONE_NONCE_COOKIE_NAME]: 'mock-nonce',
}

describe('AuthOneController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('handleLogin', () => {
    it('sets verifier, state and nonce cookies then redirects to the IdP', async () => {
      MockAuthOneService.createRedirectUrl.mockReturnValue(
        okAsync(MOCK_REDIRECT),
      )
      const mockReq = expressHandler.mockRequest()
      const mockRes = expressHandler.mockResponse()

      await AuthOneController.handleLogin(mockReq, mockRes, jest.fn())

      expect(mockRes.cookie).toHaveBeenCalledWith(
        ONE_CODE_VERIFIER_COOKIE_NAME,
        'mock-verifier',
        AuthOneController.ONE_AUTH_COOKIE_OPTIONS,
      )
      expect(mockRes.cookie).toHaveBeenCalledWith(
        ONE_STATE_COOKIE_NAME,
        'mock-state',
        AuthOneController.ONE_AUTH_COOKIE_OPTIONS,
      )
      expect(mockRes.cookie).toHaveBeenCalledWith(
        ONE_NONCE_COOKIE_NAME,
        'mock-nonce',
        AuthOneController.ONE_AUTH_COOKIE_OPTIONS,
      )
      expect(mockRes.redirect).toHaveBeenCalledWith(MOCK_REDIRECT_URL)
    })

    it('accepts an IdP-initiated login when iss matches the trusted issuer', async () => {
      MockAuthOneService.getIssuer.mockReturnValue(okAsync(MOCK_ISSUER))
      MockAuthOneService.createRedirectUrl.mockReturnValue(
        okAsync(MOCK_REDIRECT),
      )
      const mockReq = expressHandler.mockRequest({
        query: { iss: MOCK_ISSUER },
      })
      const mockRes = expressHandler.mockResponse()

      await AuthOneController.handleLogin(mockReq, mockRes, jest.fn())

      expect(mockRes.redirect).toHaveBeenCalledWith(MOCK_REDIRECT_URL)
    })

    it('rejects an IdP-initiated login when iss does not match', async () => {
      MockAuthOneService.getIssuer.mockReturnValue(okAsync(MOCK_ISSUER))
      const mockReq = expressHandler.mockRequest({
        query: { iss: 'https://evil.example.com' },
      })
      const mockRes = expressHandler.mockResponse()

      await AuthOneController.handleLogin(mockReq, mockRes, jest.fn())

      expect(MockAuthOneService.createRedirectUrl).not.toHaveBeenCalled()
      expect(mockRes.redirect).toHaveBeenCalledWith(
        `/login?status=${StatusCodes.BAD_REQUEST}`,
      )
    })

    it('redirects to login with an error status when the redirect URL cannot be created', async () => {
      MockAuthOneService.createRedirectUrl.mockReturnValue(
        errAsync(new OneCreateRedirectUrlError()),
      )
      const mockReq = expressHandler.mockRequest()
      const mockRes = expressHandler.mockResponse()

      await AuthOneController.handleLogin(mockReq, mockRes, jest.fn())

      expect(mockRes.redirect).toHaveBeenCalledWith(
        `/login?status=${StatusCodes.INTERNAL_SERVER_ERROR}`,
      )
    })
  })

  describe('handleLoginCallback', () => {
    const MOCK_AGENCY = { _id: 'mock-agency-id' } as unknown as AgencyDocument
    const MOCK_USER = {
      _id: 'mock-user-id',
      toObject: () => ({ _id: 'mock-user-id' }),
    } as unknown as IPopulatedUser

    const mockHappyPathServices = () => {
      MockAuthOneService.retrieveAccessToken.mockReturnValue(
        okAsync(MOCK_TOKENS),
      )
      MockAuthOneService.retrieveClaims.mockReturnValue(ok(MOCK_CLAIMS))
      MockAuthService.validateEmailDomain.mockReturnValue(okAsync(MOCK_AGENCY))
      MockUserService.retrieveUser.mockReturnValue(okAsync(MOCK_USER))
    }

    it('logs the user in with grantSource one and stores the IdP sid', async () => {
      mockHappyPathServices()
      const mockReq = expressHandler.mockRequest({
        query: { code: 'mock-code', state: 'mock-state' },
        cookies: MOCK_CALLBACK_COOKIES,
        others: { originalUrl: '/api/v3/auth/one/login/callback?code=x' },
      })
      const mockRes = expressHandler.mockResponse()

      await AuthOneController.handleLoginCallback(mockReq, mockRes, jest.fn())

      expect(MockAuthOneService.retrieveAccessToken).toHaveBeenCalledWith(
        'mock-verifier',
        'mock-state',
        'mock-nonce',
        '/api/v3/auth/one/login/callback?code=x',
      )
      expect(mockReq.session.user).toEqual({
        _id: 'mock-user-id',
        grantSource: 'one',
      })
      expect(mockReq.session.oneIdpSid).toBe('mock-sid')
      expect(mockRes.redirect).toHaveBeenCalledWith(
        `/login/one?status=${StatusCodes.OK}`,
      )
    })

    it('clears the single-use auth cookies regardless of outcome', async () => {
      mockHappyPathServices()
      const mockReq = expressHandler.mockRequest({
        query: { code: 'mock-code', state: 'mock-state' },
        cookies: MOCK_CALLBACK_COOKIES,
      })
      const mockRes = expressHandler.mockResponse()

      await AuthOneController.handleLoginCallback(mockReq, mockRes, jest.fn())

      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        ONE_CODE_VERIFIER_COOKIE_NAME,
        AuthOneController.ONE_AUTH_COOKIE_OPTIONS,
      )
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        ONE_STATE_COOKIE_NAME,
        AuthOneController.ONE_AUTH_COOKIE_OPTIONS,
      )
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        ONE_NONCE_COOKIE_NAME,
        AuthOneController.ONE_AUTH_COOKIE_OPTIONS,
      )
    })

    it('redirects with FORBIDDEN when the email is not whitelisted', async () => {
      MockAuthOneService.retrieveAccessToken.mockReturnValue(
        okAsync(MOCK_TOKENS),
      )
      MockAuthOneService.retrieveClaims.mockReturnValue(
        ok({ ...MOCK_CLAIMS, sub: 'user@evil.com', email: 'user@evil.com' }),
      )
      const mockReq = expressHandler.mockRequest({
        query: { code: 'mock-code', state: 'mock-state' },
        cookies: MOCK_CALLBACK_COOKIES,
      })
      const mockRes = expressHandler.mockResponse()

      await AuthOneController.handleLoginCallback(mockReq, mockRes, jest.fn())

      expect(mockReq.session.user).toBeUndefined()
      expect(mockRes.redirect).toHaveBeenCalledWith(
        `/login/one?status=${StatusCodes.FORBIDDEN}`,
      )
    })

    it('redirects with BAD_REQUEST when code is missing', async () => {
      const mockReq = expressHandler.mockRequest({
        query: { state: 'mock-state' },
        cookies: MOCK_CALLBACK_COOKIES,
      })
      const mockRes = expressHandler.mockResponse()

      await AuthOneController.handleLoginCallback(mockReq, mockRes, jest.fn())

      expect(MockAuthOneService.retrieveAccessToken).not.toHaveBeenCalled()
      expect(mockRes.redirect).toHaveBeenCalledWith(
        `/login?status=${StatusCodes.BAD_REQUEST}`,
      )
    })

    it('redirects with BAD_REQUEST when the verifier cookie is missing', async () => {
      const mockReq = expressHandler.mockRequest({
        query: { code: 'mock-code', state: 'mock-state' },
        cookies: {
          [ONE_STATE_COOKIE_NAME]: 'mock-state',
          [ONE_NONCE_COOKIE_NAME]: 'mock-nonce',
        },
      })
      const mockRes = expressHandler.mockResponse()

      await AuthOneController.handleLoginCallback(mockReq, mockRes, jest.fn())

      expect(MockAuthOneService.retrieveAccessToken).not.toHaveBeenCalled()
      expect(mockRes.redirect).toHaveBeenCalledWith(
        `/login?status=${StatusCodes.BAD_REQUEST}`,
      )
    })

    it('redirects with an error status when the token exchange fails', async () => {
      MockAuthOneService.retrieveAccessToken.mockReturnValue(
        errAsync(new OneCreateRedirectUrlError()),
      )
      const mockReq = expressHandler.mockRequest({
        query: { code: 'mock-code', state: 'mock-state' },
        cookies: MOCK_CALLBACK_COOKIES,
      })
      const mockRes = expressHandler.mockResponse()

      await AuthOneController.handleLoginCallback(mockReq, mockRes, jest.fn())

      expect(mockReq.session.user).toBeUndefined()
      expect(mockRes.redirect).toHaveBeenCalledWith(
        `/login/one?status=${StatusCodes.INTERNAL_SERVER_ERROR}`,
      )
    })
  })
})
