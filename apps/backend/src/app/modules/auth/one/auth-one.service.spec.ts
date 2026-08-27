import { getValidatedIdTokenClaims } from 'oauth4webapi'
import * as oidcClient from 'openid-client'

import { IOneVarsSchema } from 'src/types'

import { OneCreateRedirectUrlError } from './auth-one.errors'
import { AuthOneServiceClass } from './auth-one.service'

// Silence logger output during tests
jest.mock('src/app/config/logger', () => ({
  createLoggerWithLabel: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}))

const mockDiscovery = jest.mocked(oidcClient.discovery)
const mockClientSecretBasic = jest.mocked(oidcClient.ClientSecretBasic)
const mockRandomPKCECodeVerifier = jest.mocked(
  oidcClient.randomPKCECodeVerifier,
)
const mockCalculatePKCECodeChallenge = jest.mocked(
  oidcClient.calculatePKCECodeChallenge,
)
const mockRandomNonce = jest.mocked(oidcClient.randomNonce)
const mockRandomState = jest.mocked(oidcClient.randomState)
const mockBuildAuthorizationUrl = jest.mocked(oidcClient.buildAuthorizationUrl)
const mockAuthorizationCodeGrant = jest.mocked(
  oidcClient.authorizationCodeGrant,
)
const mockGetValidatedIdTokenClaims = jest.mocked(getValidatedIdTokenClaims)

const MOCK_ISSUER = 'https://one.example.com/api/auth'

const VALID_CONFIG: IOneVarsSchema = {
  discoveryUrl:
    'https://one.example.com/api/auth/.well-known/openid-configuration',
  clientId: 'real-client-id',
  clientSecret: 'real-secret',
}

// Mirrors the placeholder defaults in one.config.ts. Kept inline so a future
// drift between schema defaults and the placeholder check is caught here.
const PLACEHOLDER_CONFIG: IOneVarsSchema = {
  discoveryUrl:
    'https://placeholder.one.gov.sg/.well-known/openid-configuration',
  clientId: 'real-client-id',
  clientSecret: 'real-secret',
}

const mockClientConfig = {
  serverMetadata: () => ({
    issuer: MOCK_ISSUER,
    supportsPKCE: () => true,
  }),
} as unknown as oidcClient.Configuration

describe('AuthOneServiceClass', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getClientConfigResult — misconfigured one.gov.sg', () => {
    it('short-circuits to errAsync without calling discovery', async () => {
      const svc = new AuthOneServiceClass(PLACEHOLDER_CONFIG)

      const result = await svc.getClientConfigResult()

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        OneCreateRedirectUrlError,
      )
      expect(mockDiscovery).not.toHaveBeenCalled()
    })
  })

  describe('getClientConfigResult — discovery', () => {
    it('authenticates the client with client_secret_basic', async () => {
      mockDiscovery.mockResolvedValue(mockClientConfig)
      const svc = new AuthOneServiceClass(VALID_CONFIG)

      const result = await svc.getClientConfigResult()

      expect(result.isOk()).toBe(true)
      expect(mockClientSecretBasic).toHaveBeenCalledWith(
        VALID_CONFIG.clientSecret,
      )
    })
  })

  describe('getClientConfigResult — discovery retry cooldown', () => {
    // Stub Date.now so we can advance time without touching real timers.
    let fakeNow: number
    let nowSpy: jest.SpyInstance

    beforeEach(() => {
      fakeNow = 1_700_000_000_000
      nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => fakeNow)
    })

    afterEach(() => {
      nowSpy.mockRestore()
    })

    it('reuses the cached rejected promise within the cooldown window', async () => {
      mockDiscovery.mockRejectedValue(new Error('discovery boom'))
      const svc = new AuthOneServiceClass(VALID_CONFIG)

      const r1 = await svc.getClientConfigResult()
      expect(r1.isErr()).toBe(true)
      expect(mockDiscovery).toHaveBeenCalledTimes(1)

      // Within cooldown (60s default): cached rejection should be reused.
      fakeNow += 30_000

      const r2 = await svc.getClientConfigResult()
      expect(r2.isErr()).toBe(true)
      expect(mockDiscovery).toHaveBeenCalledTimes(1)
    })

    it('retries discovery after the cooldown elapses', async () => {
      mockDiscovery.mockRejectedValue(new Error('discovery boom'))
      const svc = new AuthOneServiceClass(VALID_CONFIG)

      const r1 = await svc.getClientConfigResult()
      expect(r1.isErr()).toBe(true)
      expect(mockDiscovery).toHaveBeenCalledTimes(1)

      // Past cooldown (60s default): a fresh discovery attempt should be made.
      fakeNow += 61_000

      const r2 = await svc.getClientConfigResult()
      expect(r2.isErr()).toBe(true)
      expect(mockDiscovery).toHaveBeenCalledTimes(2)
    })
  })

  describe('getIssuer', () => {
    it('returns the issuer from the discovered server metadata', async () => {
      mockDiscovery.mockResolvedValue(mockClientConfig)
      const svc = new AuthOneServiceClass(VALID_CONFIG)

      const result = await svc.getIssuer()

      expect(result._unsafeUnwrap()).toBe(MOCK_ISSUER)
    })
  })

  describe('createRedirectUrl', () => {
    beforeEach(() => {
      mockDiscovery.mockResolvedValue(mockClientConfig)
      mockRandomPKCECodeVerifier.mockReturnValue('mock-verifier')
      mockCalculatePKCECodeChallenge.mockResolvedValue('mock-challenge')
      mockRandomState.mockReturnValue('mock-state')
      mockRandomNonce.mockReturnValue('mock-nonce')
      mockBuildAuthorizationUrl.mockReturnValue(
        new URL('https://one.example.com/api/auth/authorize?foo=bar'),
      )
    })

    it('sends distinct state and nonce with an S256 PKCE challenge', async () => {
      const svc = new AuthOneServiceClass(VALID_CONFIG)

      const result = await svc.createRedirectUrl()

      const { redirectUrl, codeVerifier, state, nonce } = result._unsafeUnwrap()
      expect(redirectUrl).toBe(
        'https://one.example.com/api/auth/authorize?foo=bar',
      )
      expect(codeVerifier).toBe('mock-verifier')
      expect(state).toBe('mock-state')
      expect(nonce).toBe('mock-nonce')
      // state and nonce are separate values — the sso module reuses one value
      // for both, which the one.gov.sg IdP rejects (nonce must round-trip in
      // the id_token, state in the callback query).
      expect(state).not.toBe(nonce)

      expect(mockBuildAuthorizationUrl).toHaveBeenCalledWith(
        mockClientConfig,
        expect.objectContaining({
          state: 'mock-state',
          nonce: 'mock-nonce',
          scope: 'openid email',
          code_challenge: 'mock-challenge',
          code_challenge_method: 'S256',
        }),
      )
    })
  })

  describe('retrieveAccessToken', () => {
    it('passes the verifier, expected state and expected nonce to the code grant', async () => {
      mockDiscovery.mockResolvedValue(mockClientConfig)
      const mockTokens = {
        access_token: 'access',
        id_token: 'id',
      } as unknown as oidcClient.TokenEndpointResponse &
        oidcClient.TokenEndpointResponseHelpers
      mockAuthorizationCodeGrant.mockResolvedValue(mockTokens)
      const svc = new AuthOneServiceClass(VALID_CONFIG)

      const result = await svc.retrieveAccessToken(
        'mock-verifier',
        'mock-state',
        'mock-nonce',
        '/api/v3/auth/one/login/callback?code=abc&state=mock-state',
      )

      expect(result._unsafeUnwrap()).toBe(mockTokens)
      expect(mockAuthorizationCodeGrant).toHaveBeenCalledWith(
        mockClientConfig,
        expect.any(URL),
        expect.objectContaining({
          pkceCodeVerifier: 'mock-verifier',
          expectedState: 'mock-state',
          expectedNonce: 'mock-nonce',
          idTokenExpected: true,
        }),
      )
    })
  })

  describe('retrieveClaims', () => {
    const mockTokens = {} as oidcClient.TokenEndpointResponse &
      oidcClient.TokenEndpointResponseHelpers

    it('returns sub, email and sid from the validated id_token claims', () => {
      // ADR-0002: sub IS the verified government email, so no userinfo call.
      mockGetValidatedIdTokenClaims.mockReturnValue({
        sub: 'user@agency.gov.sg',
        email: 'user@agency.gov.sg',
        sid: 'mock-sid',
      } as unknown as ReturnType<typeof getValidatedIdTokenClaims>)
      const svc = new AuthOneServiceClass(VALID_CONFIG)

      const result = svc.retrieveClaims(mockTokens)

      expect(result._unsafeUnwrap()).toEqual({
        sub: 'user@agency.gov.sg',
        email: 'user@agency.gov.sg',
        sid: 'mock-sid',
      })
    })

    it('falls back to sub when the email claim is absent', () => {
      mockGetValidatedIdTokenClaims.mockReturnValue({
        sub: 'user@agency.gov.sg',
      } as unknown as ReturnType<typeof getValidatedIdTokenClaims>)
      const svc = new AuthOneServiceClass(VALID_CONFIG)

      const result = svc.retrieveClaims(mockTokens)

      expect(result._unsafeUnwrap()).toEqual({
        sub: 'user@agency.gov.sg',
        email: 'user@agency.gov.sg',
        sid: undefined,
      })
    })

    it('errors when the id_token has no validated claims', () => {
      mockGetValidatedIdTokenClaims.mockReturnValue(undefined)
      const svc = new AuthOneServiceClass(VALID_CONFIG)

      const result = svc.retrieveClaims(mockTokens)

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        OneCreateRedirectUrlError,
      )
    })
  })
})
