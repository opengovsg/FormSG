/**
 * Service-level tests focused on the boundary between MyInfoV5ServiceClass
 * and the OIDC wire. Axios is mocked so we can assert request shape
 * (DPoP header presence, Authorization scheme) without standing up mockpass.
 *
 * The full end-to-end happy path is covered by scripts/smoke-myinfo-v5.ts.
 */

import axios, { type AxiosRequestConfig } from 'axios'
import * as jose from 'jose'

import { generateDpopKeyPair } from '../myinfo.v5.dpop'
import { MyInfoV5ServiceClass } from '../myinfo.v5.service'
import type { MyInfoV5RpKeyset } from '../myinfo.v5.types'

jest.mock('axios')
const mockedAxios = axios as unknown as jest.Mocked<typeof axios>

// `jose.createRemoteJWKSet` returns a function that fetches the JWKS via the
// global `fetch`. In jest we don't want that — swap it for a local JWKS lookup
// driven by the IdP's public key the test sets up.
type JwksFn = ReturnType<typeof jose.createRemoteJWKSet>
let localJwksLookup: ReturnType<typeof jose.createLocalJWKSet> | null = null
beforeAll(() => {
  jest
    .spyOn(jose, 'createRemoteJWKSet')
    .mockImplementation(
      () =>
        ((...args: Parameters<JwksFn>) =>
          localJwksLookup!(...args)) as unknown as JwksFn,
    )
})
afterAll(() => {
  jest.restoreAllMocks()
})

const ISSUER = 'https://idp.example'
const DISCOVERY = {
  issuer: ISSUER,
  authorization_endpoint: `${ISSUER}/auth`,
  token_endpoint: `${ISSUER}/token`,
  userinfo_endpoint: `${ISSUER}/userinfo`,
  jwks_uri: `${ISSUER}/.well-known/keys`,
}

async function makeRpKeyset(): Promise<MyInfoV5RpKeyset> {
  const sig = await jose.generateKeyPair('ES256', { extractable: true })
  const enc = await jose.generateKeyPair('ECDH-ES+A256KW', {
    crv: 'P-256',
    extractable: true,
  })
  const sigPriv = await jose.exportJWK(sig.privateKey)
  const sigPub = await jose.exportJWK(sig.publicKey)
  const encPriv = await jose.exportJWK(enc.privateKey)
  const encPub = await jose.exportJWK(enc.publicKey)
  ;[sigPriv, sigPub].forEach((k) => {
    k.use = 'sig'
    k.alg = 'ES256'
    k.kid = 'sig-1'
  })
  ;[encPriv, encPub].forEach((k) => {
    k.use = 'enc'
    k.alg = 'ECDH-ES+A256KW'
    k.kid = 'enc-1'
  })
  return {
    publicJwks: { keys: [sigPub, encPub] },
    privateJwks: { keys: [sigPriv, encPriv] },
  }
}

async function makeService(opts: { dpopEnabled: boolean }) {
  return new MyInfoV5ServiceClass({
    issuer: ISSUER,
    clientId: 'client-x',
    redirectUri: 'https://app.example/cb',
    rpKeyset: await makeRpKeyset(),
    dpopEnabled: opts.dpopEnabled,
  })
}

describe('MyInfoV5ServiceClass — DPoP vs Bearer', () => {
  beforeEach(() => {
    mockedAxios.get.mockReset()
    mockedAxios.post.mockReset()
    mockedAxios.get.mockImplementation(async (url: string) => {
      if (url.endsWith('/.well-known/openid-configuration')) {
        return { data: DISCOVERY } as unknown as Awaited<
          ReturnType<typeof axios.get>
        >
      }
      throw new Error(`unmocked GET ${url}`)
    })
  })

  describe('exchangeCodeForTokens', () => {
    it('sends no DPoP header when dpopEnabled=false', async () => {
      const svc = await makeService({ dpopEnabled: false })
      mockedAxios.post.mockResolvedValueOnce({
        data: { access_token: 'tok', token_type: 'Bearer' },
      } as unknown as Awaited<ReturnType<typeof axios.post>>)

      const result = await svc.exchangeCodeForTokens({
        code: 'abc',
        codeVerifier: 'verifier',
      })
      expect(result.isOk()).toBe(true)
      expect(mockedAxios.post).toHaveBeenCalledTimes(1)
      const [, , cfg] = mockedAxios.post.mock.calls[0] as [
        string,
        string,
        AxiosRequestConfig,
      ]
      expect(cfg.headers?.dpop).toBeUndefined()
    })

    it('attaches a DPoP proof bound to the supplied keypair when dpopEnabled=true', async () => {
      const svc = await makeService({ dpopEnabled: true })
      const kp = await generateDpopKeyPair()
      mockedAxios.post.mockResolvedValueOnce({
        data: { access_token: 'tok', token_type: 'DPoP' },
      } as unknown as Awaited<ReturnType<typeof axios.post>>)

      const result = await svc.exchangeCodeForTokens({
        code: 'abc',
        codeVerifier: 'verifier',
        dpopKeypair: kp,
      })
      expect(result.isOk()).toBe(true)
      const [, , cfg] = mockedAxios.post.mock.calls[0] as [
        string,
        string,
        AxiosRequestConfig,
      ]
      const dpopHeader = cfg.headers?.dpop as string
      expect(dpopHeader).toBeDefined()

      // The proof must be a JWT verifiable by the supplied keypair, with
      // htm=POST and htu equal to the token endpoint.
      const publicKey = await jose.importJWK(kp.publicJwk, 'ES256')
      const { payload, protectedHeader } = await jose.jwtVerify(
        dpopHeader,
        publicKey,
      )
      expect(protectedHeader.typ).toBe('dpop+jwt')
      expect(payload.htm).toBe('POST')
      expect(payload.htu).toBe(DISCOVERY.token_endpoint)
      expect(payload.ath).toBeUndefined()
    })

    it('returns an error when DPoP is enabled but no keypair is supplied', async () => {
      const svc = await makeService({ dpopEnabled: true })
      const result = await svc.exchangeCodeForTokens({
        code: 'abc',
        codeVerifier: 'verifier',
      })
      expect(result.isErr()).toBe(true)
      expect(mockedAxios.post).not.toHaveBeenCalled()
    })
  })

  describe('fetchUserinfo', () => {
    // Build a userinfo JWE the service can decrypt. Uses the public enc key
    // from the service's RP keyset, signed with a fake IDP key.
    async function buildUserinfoJwe(
      rpEncJwk: jose.JWK,
      claims: Record<string, unknown>,
    ): Promise<{ jwe: string; idpPublic: jose.KeyLike }> {
      const { publicKey, privateKey } = await jose.generateKeyPair('ES256', {
        extractable: true,
      })
      const signed = await new jose.SignJWT(claims)
        .setProtectedHeader({ alg: 'ES256', typ: 'JWT', kid: 'idp-sig-1' })
        .sign(privateKey)
      const encKey = await jose.importJWK(
        rpEncJwk,
        rpEncJwk.alg ?? 'ECDH-ES+A256KW',
      )
      const jwe = await new jose.CompactEncrypt(
        new TextEncoder().encode(signed),
      )
        .setProtectedHeader({
          alg: 'ECDH-ES+A256KW',
          enc: 'A256GCM',
          typ: 'JWT',
          cty: 'JWT',
          kid: 'enc-1',
        })
        .encrypt(encKey)
      return { jwe, idpPublic: publicKey as jose.KeyLike }
    }

    async function installIdpJwks(idpPublic: jose.KeyLike): Promise<void> {
      const pubJwk = await jose.exportJWK(idpPublic)
      pubJwk.use = 'sig'
      pubJwk.alg = 'ES256'
      pubJwk.kid = 'idp-sig-1'
      localJwksLookup = jose.createLocalJWKSet({ keys: [pubJwk] })
    }

    async function setupUserinfoMocks(svc: MyInfoV5ServiceClass): Promise<{
      jwe: string
      getCall: () => AxiosRequestConfig | undefined
    }> {
      const publicJwks = svc.getPublicJwks()
      const encKey = publicJwks.keys.find((k) => k.use === 'enc')!
      const { jwe, idpPublic } = await buildUserinfoJwe(encKey, {
        sub: 'u',
        iss: ISSUER,
        aud: 'client-x',
        iat: 1,
        name: { value: 'TAN' },
      })
      await installIdpJwks(idpPublic)
      let userinfoCall: AxiosRequestConfig | undefined
      mockedAxios.get.mockImplementation(
        async (url: string, cfg?: AxiosRequestConfig) => {
          if (url.endsWith('/.well-known/openid-configuration')) {
            return { data: DISCOVERY } as unknown as Awaited<
              ReturnType<typeof axios.get>
            >
          }
          if (url === DISCOVERY.userinfo_endpoint) {
            userinfoCall = cfg
            return { data: jwe } as unknown as Awaited<
              ReturnType<typeof axios.get>
            >
          }
          throw new Error(`unmocked GET ${url}`)
        },
      )
      return { jwe, getCall: () => userinfoCall }
    }

    it('sends Authorization: Bearer when dpopEnabled=false', async () => {
      const svc = await makeService({ dpopEnabled: false })
      const { getCall } = await setupUserinfoMocks(svc)

      const result = await svc.fetchUserinfo({ accessToken: 'tok-bearer' })
      expect(result.isOk()).toBe(true)
      const userinfoCall = getCall()
      expect(userinfoCall?.headers?.authorization).toBe('Bearer tok-bearer')
      expect(userinfoCall?.headers?.dpop).toBeUndefined()
    })

    it('sends Authorization: DPoP + DPoP proof with ath when dpopEnabled=true', async () => {
      const svc = await makeService({ dpopEnabled: true })
      const kp = await generateDpopKeyPair()
      const { getCall } = await setupUserinfoMocks(svc)

      const result = await svc.fetchUserinfo({
        accessToken: 'tok-dpop',
        dpopKeypair: kp,
      })
      expect(result.isOk()).toBe(true)
      const userinfoCall = getCall()
      expect(userinfoCall?.headers?.authorization).toBe('DPoP tok-dpop')

      const dpopHeader = userinfoCall?.headers?.dpop as string
      const publicKey = await jose.importJWK(kp.publicJwk, 'ES256')
      const { payload } = await jose.jwtVerify(dpopHeader, publicKey)
      expect(payload.htm).toBe('GET')
      expect(payload.htu).toBe(DISCOVERY.userinfo_endpoint)
      expect(payload.ath).toBeDefined()
    })

    it('returns an error when DPoP is enabled but keypair missing', async () => {
      const svc = await makeService({ dpopEnabled: true })
      const result = await svc.fetchUserinfo({ accessToken: 'x' })
      expect(result.isErr()).toBe(true)
    })
  })
})
