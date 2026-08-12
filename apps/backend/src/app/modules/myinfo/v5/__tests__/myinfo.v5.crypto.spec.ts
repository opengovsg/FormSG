import crypto from 'crypto'
import * as jose from 'jose'

import {
  createClientAssertion,
  deriveCodeChallenge,
  generateNonce,
  generatePkceVerifier,
  pickJwk,
  requireJwk,
} from '../myinfo.v5.crypto'
import { decodeV5State } from '../myinfo.v5.service'

describe('v5 PKCE helpers', () => {
  it('generates verifiers in the RFC 7636 length range', () => {
    const v = generatePkceVerifier()
    expect(v.length).toBeGreaterThanOrEqual(43)
    expect(v.length).toBeLessThanOrEqual(128)
    // url-safe base64, no padding
    expect(v).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('derives a stable S256 challenge that matches the spec', () => {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
    const challenge = deriveCodeChallenge(verifier)
    // Known-good value from RFC 7636 §4.6
    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
  })

  it('generates url-safe nonces', () => {
    const n = generateNonce()
    expect(n).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(n.length).toBeGreaterThanOrEqual(32)
  })
})

describe('v5 state encode/decode', () => {
  // Sanity round-trip — encoded inside the service, decoded by the controller.
  it('round-trips formId and encodedQuery', () => {
    // We don't export encodeState; reproduce its shape inline.
    const state = Buffer.from(
      JSON.stringify({ formId: 'abc123', encodedQuery: 'q=1', v: 5 }),
    ).toString('base64url')
    const result = decodeV5State(state)
    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap().formId).toBe('abc123')
    expect(result._unsafeUnwrap().encodedQuery).toBe('q=1')
  })

  it('rejects malformed state', () => {
    expect(decodeV5State('not-base64-json').isErr()).toBe(true)
    expect(decodeV5State(Buffer.from('{}').toString('base64url')).isErr()).toBe(
      true,
    )
  })
})

describe('v5 client assertion', () => {
  it('produces a JWT verifiable by the matching public key', async () => {
    const { publicKey, privateKey } = await jose.generateKeyPair('ES256', {
      extractable: true,
    })
    const privJwk = await jose.exportJWK(privateKey)
    privJwk.kid = 'k1'
    const importedPriv = (await jose.importJWK(
      privJwk,
      'ES256',
    )) as jose.KeyLike

    const jwt = await createClientAssertion({
      clientId: 'client-x',
      audience: 'https://idp.example/',
      signingKey: importedPriv,
      signingKid: 'k1',
    })

    const verified = await jose.jwtVerify(jwt, publicKey)
    expect(verified.payload.iss).toBe('client-x')
    expect(verified.payload.sub).toBe('client-x')
    expect(verified.payload.aud).toBe('https://idp.example/')
    expect(verified.payload.jti).toBeDefined()
    expect(verified.protectedHeader.alg).toBe('ES256')
    expect(verified.protectedHeader.kid).toBe('k1')
  })
})

describe('pickJwk / requireJwk', () => {
  const set: jose.JSONWebKeySet = {
    keys: [
      { kty: 'EC', use: 'sig', kid: 's' } as jose.JWK,
      { kty: 'EC', use: 'enc', kid: 'e' } as jose.JWK,
    ],
  }

  it('pickJwk returns first key matching use', () => {
    expect(pickJwk(set, 'sig')?.kid).toBe('s')
    expect(pickJwk(set, 'enc')?.kid).toBe('e')
  })

  it('pickJwk returns undefined when missing', () => {
    expect(pickJwk({ keys: [] }, 'sig')).toBeUndefined()
  })

  it('requireJwk throws when missing (boot-time only)', () => {
    expect(() =>
      requireJwk({ keys: [{ kty: 'EC', use: 'sig' } as jose.JWK] }, 'enc'),
    ).toThrow()
  })
})

// Ensure crypto.randomBytes works in the test env (sanity).
describe('test env sanity', () => {
  it('has crypto.randomBytes', () => {
    expect(crypto.randomBytes(4).length).toBe(4)
  })
})
