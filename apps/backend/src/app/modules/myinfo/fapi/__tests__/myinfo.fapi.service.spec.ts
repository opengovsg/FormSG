import crypto from 'crypto'
import { MyInfoAttribute } from 'formsg-shared/types'
import * as client from 'openid-client'

import { DatabaseError } from '../../../core/core.errors'
import { MyInfoData } from '../../myinfo.adapter'
import { MYINFO_FAPI_REDIRECT_URI } from '../myinfo.fapi.constants'
import {
  MyInfoFapiAuthRequestError,
  MyInfoFapiExchangeError,
  MyInfoFapiFetchError,
  MyInfoFapiMissingSessionError,
  MyInfoFapiMissingUinFinError,
} from '../myinfo.fapi.errors'
import * as MyInfoFapiService from '../myinfo.fapi.service'
import getMyInfoFapiSessionModel from '../myinfo.fapi.session.model'

/**
 * jest-setupAfterEnv replaces openid-client with a two-function stub, because
 * ts-jest cannot load ESM-only packages. This overrides it with the surface the
 * service actually uses. `randomDPoPKeyPair` runs real WebCrypto so the key round
 * trip across the redirect is exercised for real, and `getDPoPHandle` records the
 * key pair it was handed so tests can inspect it.
 */
jest.mock('openid-client', () => {
  return {
    modifyAssertion: Symbol.for('modifyAssertion'),
    randomPKCECodeVerifier: jest.fn(() => 'mock-code-verifier'),
    randomState: jest.fn(() => 'mock-state'),
    randomNonce: jest.fn(() => 'mock-nonce'),
    calculatePKCECodeChallenge: jest.fn(async () => 'mock-code-challenge'),
    randomDPoPKeyPair: jest.fn(async () =>
      globalThis.crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['sign', 'verify'],
      ),
    ),
    getDPoPHandle: jest.fn((_config, keyPair, options) => ({
      keyPair,
      options,
    })),
    buildAuthorizationUrlWithPAR: jest.fn(
      async () => new URL('https://singpass.test/fapi/auth?request_uri=mock'),
    ),
    authorizationCodeGrant: jest.fn(),
    fetchUserInfo: jest.fn(),
  }
})

jest.mock('../myinfo.fapi.client', () => ({
  ...jest.requireActual('../myinfo.fapi.client'),
  getConfiguration: jest.fn(async () => ({ mock: 'configuration' })),
}))

jest.mock('../myinfo.fapi.session.model', () => {
  const model = { consumeExchanged: jest.fn(), createPending: jest.fn() }
  return { __esModule: true, default: () => model }
})

const MockClient = jest.mocked(client)
const MockSession = jest.mocked(getMyInfoFapiSessionModel({} as never))

const MOCK_FORM_ID = '5f8f4b8f8f8f8f8f8f8f8f8f'
const MOCK_PERSON_INFO = {
  uinfin: { value: 'S1234567D' },
  name: { value: 'Test Person' },
}

const mockTokens = (claims?: Record<string, unknown>) =>
  ({
    access_token: 'mock-access-token',
    claims: () => claims,
  }) as never

const startLogin = async () => {
  MockSession.createPending.mockResolvedValueOnce('mock-session-id')
  const result = await MyInfoFapiService.startLogin({
    formId: MOCK_FORM_ID,
    requestedAttributes: [MyInfoAttribute.Name],
  })
  return result._unsafeUnwrap()
}

/** The DPoP key never leaves the service; recover it from the persisted session. */
const lastPersistedSession = () => {
  const calls = MockSession.createPending.mock.calls
  return calls[calls.length - 1][0]
}

/**
 * A real EC private JWK. The service rehydrates whatever is stored into a
 * CryptoKeyPair, so a placeholder would fail before reaching the call under test.
 */
let MOCK_DPOP_JWK: JsonWebKey

const pendingSession = (dpopPrivateJwk: JsonWebKey) => ({
  formId: MOCK_FORM_ID,
  state: 'mock-state',
  nonce: 'mock-nonce',
  codeVerifier: 'mock-code-verifier',
  dpopPrivateJwk,
})

describe('myinfo.fapi.service', () => {
  beforeAll(async () => {
    await startLogin()
    MOCK_DPOP_JWK = lastPersistedSession().dpopPrivateJwk
    jest.clearAllMocks()
  })

  afterEach(() => jest.clearAllMocks())

  describe('startLogin', () => {
    it('should push an authorization request with PKCE and the registered redirect URI', async () => {
      const start = await startLogin()

      expect(MockClient.buildAuthorizationUrlWithPAR).toHaveBeenCalledWith(
        expect.anything(),
        {
          redirect_uri: MYINFO_FAPI_REDIRECT_URI,
          response_type: 'code',
          scope: 'openid name uinfin',
          state: 'mock-state',
          nonce: 'mock-nonce',
          code_challenge: 'mock-code-challenge',
          code_challenge_method: 'S256',
        },
        expect.objectContaining({ DPoP: expect.anything() }),
      )
      expect(start).toEqual({
        sessionId: 'mock-session-id',
        redirectUrl: 'https://singpass.test/fapi/auth?request_uri=mock',
      })
    })

    it('should persist the protocol secrets in the pending session, not return them', async () => {
      const start = await startLogin()

      expect(MockSession.createPending).toHaveBeenCalledWith({
        formId: MOCK_FORM_ID,
        encodedQuery: undefined,
        state: 'mock-state',
        nonce: 'mock-nonce',
        codeVerifier: 'mock-code-verifier',
        dpopPrivateJwk: expect.objectContaining({ d: expect.any(String) }),
      })
      expect(Object.keys(start)).toEqual(['sessionId', 'redirectUrl'])
    })

    it('should cap the DPoP proof expiry at two minutes, as Singpass requires', async () => {
      await startLogin()

      const [, , options] = MockClient.getDPoPHandle.mock.calls[0]
      const payload = { iat: 1_000 } as Record<string, unknown>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(options as any)[client.modifyAssertion]({}, payload)

      expect(payload.exp).toBe(1_120)
    })

    it('should return an auth request error when PAR fails, without creating a session', async () => {
      const parError = Object.assign(
        new Error('server responded with HTTP 400'),
        {
          name: 'ResponseBodyError',
          code: 'OAUTH_RESPONSE_BODY_ERROR',
          error: 'invalid_scope',
          error_description: 'requested scope is not allowed',
          status: 400,
        },
      )
      MockClient.buildAuthorizationUrlWithPAR.mockRejectedValueOnce(parError)

      const result = await MyInfoFapiService.startLogin({
        formId: MOCK_FORM_ID,
        requestedAttributes: [MyInfoAttribute.Name],
      })

      const err = result._unsafeUnwrapErr()
      expect(err).toBeInstanceOf(MyInfoFapiAuthRequestError)
      expect(err.meta).toEqual(
        expect.objectContaining({
          formId: MOCK_FORM_ID,
          scope: 'openid name uinfin',
          redirectUri: MYINFO_FAPI_REDIRECT_URI,
          oauthError: 'invalid_scope',
          oauthErrorDescription: 'requested scope is not allowed',
          httpStatus: 400,
          errCode: 'OAUTH_RESPONSE_BODY_ERROR',
        }),
      )
      expect(MockSession.createPending).not.toHaveBeenCalled()
    })

    it('should return a database error when the session cannot be persisted', async () => {
      MockSession.createPending.mockRejectedValueOnce(new Error('mongo down'))

      const result = await MyInfoFapiService.startLogin({
        formId: MOCK_FORM_ID,
        requestedAttributes: [MyInfoAttribute.Name],
      })

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })
  })

  describe('DPoP key across the redirect', () => {
    it('should rehydrate a key pair openid-client can build a proof from', async () => {
      await startLogin()
      const { dpopPrivateJwk } = lastPersistedSession()
      MockClient.authorizationCodeGrant.mockResolvedValueOnce(
        mockTokens({ sub: 'mock-sub' }),
      )
      MockClient.getDPoPHandle.mockClear()

      await MyInfoFapiService.exchangeCallback({
        code: { code: 'mock-code', state: 'mock-state' },
        session: pendingSession(dpopPrivateJwk),
      })

      const [, keyPair] = MockClient.getDPoPHandle.mock.calls[0]
      // oauth4webapi rejects a key pair whose public key cannot be exported
      // into the proof's jwk header.
      expect(keyPair.publicKey.extractable).toBe(true)
      expect(keyPair.privateKey.extractable).toBe(false)
      const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
      expect(publicJwk).toMatchObject({ kty: 'EC', crv: 'P-256' })
      expect(publicJwk.d).toBeUndefined()
    })

    it('should rehydrate the same key, so the proof stays verifiable', async () => {
      await startLogin()
      const { dpopPrivateJwk } = lastPersistedSession()
      MockClient.authorizationCodeGrant.mockResolvedValueOnce(
        mockTokens({ sub: 'mock-sub' }),
      )
      MockClient.getDPoPHandle.mockClear()

      await MyInfoFapiService.exchangeCallback({
        code: { code: 'mock-code', state: 'mock-state' },
        session: pendingSession(dpopPrivateJwk),
      })

      const [, keyPair] = MockClient.getDPoPHandle.mock.calls[0]
      const payload = Buffer.from('mock-proof')
      const signature = await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        keyPair.privateKey,
        payload,
      )

      await expect(
        crypto.subtle.verify(
          { name: 'ECDSA', hash: 'SHA-256' },
          keyPair.publicKey,
          signature,
          payload,
        ),
      ).resolves.toBe(true)
    })
  })

  describe('exchangeCallback', () => {
    // Lazy: MOCK_DPOP_JWK is only populated in beforeAll.
    const session = () => pendingSession(MOCK_DPOP_JWK)

    beforeEach(() =>
      MockClient.getDPoPHandle.mockImplementation(() => ({}) as never),
    )

    it('should build the callback URL from the registered redirect URI, not the request', async () => {
      MockClient.authorizationCodeGrant.mockResolvedValueOnce(
        mockTokens({ sub: 'mock-sub' }),
      )

      const result = await MyInfoFapiService.exchangeCallback({
        code: { code: 'mock-code', state: 'mock-state', iss: 'mock-iss' },
        session: session(),
      })

      const [, currentUrl, checks] =
        MockClient.authorizationCodeGrant.mock.calls[0]
      expect((currentUrl as URL).href).toBe(
        `${MYINFO_FAPI_REDIRECT_URI}?code=mock-code&state=mock-state&iss=mock-iss`,
      )
      expect(checks).toEqual({
        pkceCodeVerifier: 'mock-code-verifier',
        expectedState: 'mock-state',
        expectedNonce: 'mock-nonce',
        idTokenExpected: true,
      })
      expect(result._unsafeUnwrap()).toEqual({
        accessToken: 'mock-access-token',
        sub: 'mock-sub',
      })
    })

    it('should reject an ID token with no sub', async () => {
      MockClient.authorizationCodeGrant.mockResolvedValueOnce(mockTokens({}))

      const result = await MyInfoFapiService.exchangeCallback({
        code: { code: 'mock-code', state: 'mock-state' },
        session: session(),
      })

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(MyInfoFapiExchangeError)
    })

    it('should surface a tampered state as an exchange error', async () => {
      MockClient.authorizationCodeGrant.mockRejectedValueOnce(
        new Error('unexpected "state" response parameter value'),
      )

      const result = await MyInfoFapiService.exchangeCallback({
        code: { code: 'mock-code', state: 'tampered' },
        session: session(),
      })

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(MyInfoFapiExchangeError)
    })
  })

  describe('fetchPerson', () => {
    const args = () => ({
      accessToken: 'mock-access-token',
      sub: 'mock-sub',
      dpopPrivateJwk: MOCK_DPOP_JWK,
    })

    beforeEach(() =>
      MockClient.getDPoPHandle.mockImplementation(() => ({}) as never),
    )

    it('should assert the subject and normalise userinfo to v3 shape', async () => {
      MockClient.fetchUserInfo.mockResolvedValueOnce({
        sub: 'mock-sub',
        person_info: MOCK_PERSON_INFO,
      } as never)

      const result = await MyInfoFapiService.fetchPerson(args())

      expect(MockClient.fetchUserInfo).toHaveBeenCalledWith(
        expect.anything(),
        'mock-access-token',
        'mock-sub',
        expect.anything(),
      )
      expect(result._unsafeUnwrap()).toEqual({
        uinFin: 'S1234567D',
        data: MOCK_PERSON_INFO,
      })
    })

    it('should refuse to fall back to sub when uinfin is absent', async () => {
      MockClient.fetchUserInfo.mockResolvedValueOnce({
        sub: 'mock-sub',
        person_info: { name: { value: 'Test Person' } },
      } as never)

      const result = await MyInfoFapiService.fetchPerson(args())

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        MyInfoFapiMissingUinFinError,
      )
    })

    it('should return a fetch error when userinfo fails', async () => {
      MockClient.fetchUserInfo.mockRejectedValueOnce(new Error('server_error'))

      const result = await MyInfoFapiService.fetchPerson(args())

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(MyInfoFapiFetchError)
    })
  })

  describe('loadPersonForSession', () => {
    beforeEach(() =>
      MockClient.getDPoPHandle.mockImplementation(() => ({}) as never),
    )

    it('should consume the session and return MyInfoData', async () => {
      MockSession.consumeExchanged.mockResolvedValueOnce({
        formId: MOCK_FORM_ID,
        accessToken: 'mock-access-token',
        sub: 'mock-sub',
        dpopPrivateJwk: MOCK_DPOP_JWK,
      })
      MockClient.fetchUserInfo.mockResolvedValueOnce({
        sub: 'mock-sub',
        person_info: MOCK_PERSON_INFO,
      } as never)

      const result =
        await MyInfoFapiService.loadPersonForSession('mock-session-id')

      expect(MockSession.consumeExchanged).toHaveBeenCalledWith(
        'mock-session-id',
      )
      const myInfoData = result._unsafeUnwrap()
      expect(myInfoData).toBeInstanceOf(MyInfoData)
      expect(myInfoData.getUinFin()).toBe('S1234567D')
    })

    it('should error without calling userinfo when no exchanged session exists', async () => {
      MockSession.consumeExchanged.mockResolvedValueOnce(null)

      const result =
        await MyInfoFapiService.loadPersonForSession('mock-session-id')

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        MyInfoFapiMissingSessionError,
      )
      expect(MockClient.fetchUserInfo).not.toHaveBeenCalled()
    })
  })
})
