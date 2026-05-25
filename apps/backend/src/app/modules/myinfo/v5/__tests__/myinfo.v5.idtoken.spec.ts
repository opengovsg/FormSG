/**
 * Tests for ID Token nonce verification (OIDC §3.1.3.7).
 *
 * Covers happy path (matching nonce), mismatch (replay defense), and the
 * encrypted/unencrypted ID Token shapes — Singpass returns a JWE-wrapped JWS
 * in normal operation but mockpass with `SINGPASS_CLIENT_PROFILE=direct`
 * returns a bare JWS.
 */

import axios from 'axios'
import * as jose from 'jose'

import { MyInfoV5ServiceClass } from '../myinfo.v5.service'
import type { MyInfoV5RpKeyset } from '../myinfo.v5.types'

jest.mock('axios')
const mockedAxios = axios as unknown as jest.Mocked<typeof axios>

const ISSUER = 'https://idp.example'
const DISCOVERY = {
  issuer: ISSUER,
  authorization_endpoint: `${ISSUER}/auth`,
  token_endpoint: `${ISSUER}/token`,
  userinfo_endpoint: `${ISSUER}/userinfo`,
  jwks_uri: `${ISSUER}/.well-known/keys`,
}

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
afterAll(() => jest.restoreAllMocks())

beforeEach(() => {
  mockedAxios.get.mockReset()
  mockedAxios.get.mockImplementation(async (url: string) => {
    if (url.endsWith('/.well-known/openid-configuration')) {
      return { data: DISCOVERY } as unknown as Awaited<
        ReturnType<typeof axios.get>
      >
    }
    throw new Error(`unmocked GET ${url}`)
  })
})

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

async function buildJws(
  payload: Record<string, unknown>,
): Promise<{ jws: string; idpPublic: jose.KeyLike }> {
  const { publicKey, privateKey } = await jose.generateKeyPair('ES256', {
    extractable: true,
  })
  const jws = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'ES256', typ: 'JWT', kid: 'idp-sig-1' })
    .sign(privateKey)
  return { jws, idpPublic: publicKey as jose.KeyLike }
}

async function wrapJwsInJwe(jws: string, encJwk: jose.JWK): Promise<string> {
  const encKey = await jose.importJWK(encJwk, encJwk.alg ?? 'ECDH-ES+A256KW')
  return await new jose.CompactEncrypt(new TextEncoder().encode(jws))
    .setProtectedHeader({
      alg: 'ECDH-ES+A256KW',
      enc: 'A256GCM',
      typ: 'JWT',
      cty: 'JWT',
      kid: 'enc-1',
    })
    .encrypt(encKey)
}

async function installIdpJwks(pub: jose.KeyLike): Promise<void> {
  const jwk = await jose.exportJWK(pub)
  jwk.use = 'sig'
  jwk.alg = 'ES256'
  jwk.kid = 'idp-sig-1'
  localJwksLookup = jose.createLocalJWKSet({ keys: [jwk] })
}

describe('MyInfoV5ServiceClass.verifyIdToken', () => {
  let svc: MyInfoV5ServiceClass
  let rpKeyset: MyInfoV5RpKeyset

  beforeEach(async () => {
    rpKeyset = await makeRpKeyset()
    svc = new MyInfoV5ServiceClass({
      issuer: ISSUER,
      clientId: 'client-x',
      redirectUri: 'https://app.example/cb',
      rpKeyset,
      dpopEnabled: false,
    })
  })

  it('accepts a matching nonce in a JWE-wrapped id_token (prod shape)', async () => {
    const { jws, idpPublic } = await buildJws({
      sub: 'u',
      iss: 'https://idp.example',
      aud: 'client-x',
      iat: 1,
      nonce: 'good-nonce',
    })
    await installIdpJwks(idpPublic)
    const encJwk = rpKeyset.publicJwks.keys.find((k) => k.use === 'enc')!
    const idToken = await wrapJwsInJwe(jws, encJwk)

    const result = await svc.verifyIdToken({
      idToken,
      expectedNonce: 'good-nonce',
    })
    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap().nonce).toBe('good-nonce')
  })

  it('accepts a matching nonce in a bare JWS id_token (mockpass direct profile)', async () => {
    const { jws, idpPublic } = await buildJws({
      sub: 'u',
      iss: 'https://idp.example',
      aud: 'client-x',
      iat: 1,
      nonce: 'good-nonce',
    })
    await installIdpJwks(idpPublic)

    const result = await svc.verifyIdToken({
      idToken: jws,
      expectedNonce: 'good-nonce',
    })
    expect(result.isOk()).toBe(true)
  })

  it('rejects a mismatched nonce', async () => {
    const { jws, idpPublic } = await buildJws({
      sub: 'u',
      iss: 'https://idp.example',
      aud: 'client-x',
      iat: 1,
      nonce: 'attacker-nonce',
    })
    await installIdpJwks(idpPublic)

    const result = await svc.verifyIdToken({
      idToken: jws,
      expectedNonce: 'real-nonce',
    })
    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr().message).toMatch(/nonce mismatch/i)
  })

  it('rejects a malformed id_token (wrong segment count)', async () => {
    await installIdpJwks(
      (await jose.generateKeyPair('ES256', { extractable: true })).publicKey,
    )
    const result = await svc.verifyIdToken({
      idToken: 'a.b', // 2 segments — not JWS (3) and not JWE (5)
      expectedNonce: 'whatever',
    })
    expect(result.isErr()).toBe(true)
  })

  it('rejects a JWS signed by a different key (signature mismatch)', async () => {
    const { jws } = await buildJws({
      sub: 'u',
      iss: 'https://idp.example',
      aud: 'client-x',
      iat: 1,
      nonce: 'good-nonce',
    })
    // Install a DIFFERENT signing key — verification should fail.
    const { publicKey: otherPub } = await jose.generateKeyPair('ES256', {
      extractable: true,
    })
    await installIdpJwks(otherPub as jose.KeyLike)

    const result = await svc.verifyIdToken({
      idToken: jws,
      expectedNonce: 'good-nonce',
    })
    expect(result.isErr()).toBe(true)
  })
})
