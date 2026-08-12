import * as jose from 'jose'

import {
  computeAccessTokenHash,
  createDpopProof,
  generateDpopKeyPair,
  importDpopKeyPair,
} from '../myinfo.v5.dpop'

describe('DPoP helpers', () => {
  describe('generateDpopKeyPair', () => {
    it('produces an ES256 EC keypair with a base64url thumbprint', async () => {
      const kp = await generateDpopKeyPair()
      expect(kp.publicJwk.kty).toBe('EC')
      expect(kp.publicJwk.crv).toBe('P-256')
      expect(kp.thumbprint).toMatch(/^[A-Za-z0-9_-]{43}$/)
      // Two generations should yield different thumbprints.
      const kp2 = await generateDpopKeyPair()
      expect(kp.thumbprint).not.toBe(kp2.thumbprint)
    })
  })

  describe('importDpopKeyPair', () => {
    it('round-trips: exported private JWK can be re-imported and used', async () => {
      const original = await generateDpopKeyPair()
      const privateJwk = await jose.exportJWK(original.privateKey)
      const rehydrated = await importDpopKeyPair(privateJwk)

      // Thumbprint of the recovered public key matches the original.
      expect(rehydrated.thumbprint).toBe(original.thumbprint)

      // Proofs from the rehydrated keypair verify against the original public key.
      const proof = await createDpopProof({
        keypair: rehydrated,
        htm: 'POST',
        htu: 'https://idp.example/token',
      })
      const originalPublic = await jose.importJWK(original.publicJwk, 'ES256')
      const { payload, protectedHeader } = await jose.jwtVerify(
        proof,
        originalPublic,
      )
      expect(protectedHeader.typ).toBe('dpop+jwt')
      expect(payload.htm).toBe('POST')
    })
  })

  describe('createDpopProof', () => {
    let keypair: Awaited<ReturnType<typeof generateDpopKeyPair>>
    let publicKey: jose.KeyLike

    beforeAll(async () => {
      keypair = await generateDpopKeyPair()
      publicKey = (await jose.importJWK(
        keypair.publicJwk,
        'ES256',
      )) as jose.KeyLike
    })

    it('embeds the public JWK in the header and signs verifiably', async () => {
      const proof = await createDpopProof({
        keypair,
        htm: 'POST',
        htu: 'https://idp.example/token',
      })
      const { payload, protectedHeader } = await jose.jwtVerify(
        proof,
        publicKey,
      )
      expect(protectedHeader.typ).toBe('dpop+jwt')
      expect(protectedHeader.alg).toBe('ES256')
      expect(protectedHeader.jwk).toBeDefined()
      expect((protectedHeader.jwk as { x: string }).x).toBe(
        keypair.publicJwk.x as string,
      )
      expect(payload.htm).toBe('POST')
      expect(payload.htu).toBe('https://idp.example/token')
      expect(typeof payload.jti).toBe('string')
      expect(typeof payload.iat).toBe('number')
      expect(payload.ath).toBeUndefined()
    })

    it('normalises method to uppercase', async () => {
      const proof = await createDpopProof({
        keypair,
        htm: 'get',
        htu: 'https://idp.example/userinfo',
      })
      const { payload } = await jose.jwtVerify(proof, publicKey)
      expect(payload.htm).toBe('GET')
    })

    it('strips query and fragment from htu per RFC 9449 §4.2', async () => {
      const proof = await createDpopProof({
        keypair,
        htm: 'GET',
        htu: 'https://idp.example/userinfo?foo=bar#section',
      })
      const { payload } = await jose.jwtVerify(proof, publicKey)
      expect(payload.htu).toBe('https://idp.example/userinfo')
    })

    it('includes ath claim when an access token is supplied', async () => {
      const accessToken = 'mock-access-token-value'
      const proof = await createDpopProof({
        keypair,
        htm: 'GET',
        htu: 'https://idp.example/userinfo',
        accessToken,
      })
      const { payload } = await jose.jwtVerify(proof, publicKey)
      expect(payload.ath).toBe(computeAccessTokenHash(accessToken))
    })

    it('generates distinct jti per call', async () => {
      const a = await createDpopProof({
        keypair,
        htm: 'GET',
        htu: 'https://idp.example/x',
      })
      const b = await createDpopProof({
        keypair,
        htm: 'GET',
        htu: 'https://idp.example/x',
      })
      const ap = await jose.jwtVerify(a, publicKey)
      const bp = await jose.jwtVerify(b, publicKey)
      expect(ap.payload.jti).not.toBe(bp.payload.jti)
    })
  })

  describe('computeAccessTokenHash', () => {
    it('matches the spec example shape (base64url, no padding)', () => {
      const h = computeAccessTokenHash('any-token')
      expect(h).toMatch(/^[A-Za-z0-9_-]+$/)
      // sha256 → 32 bytes → 43 base64url chars
      expect(h.length).toBe(43)
    })

    it('is deterministic for the same token', () => {
      expect(computeAccessTokenHash('abc')).toBe(computeAccessTokenHash('abc'))
    })

    it('differs for different tokens', () => {
      expect(computeAccessTokenHash('a')).not.toBe(computeAccessTokenHash('b'))
    })
  })
})
