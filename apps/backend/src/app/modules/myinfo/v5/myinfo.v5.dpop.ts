/**
 * RFC 9449 DPoP (Demonstrating Proof of Possession) support for the MyInfo v5
 * / Singpass Auth API v5 flow.
 *
 * DPoP binds an access token to a public key held by the client. Each protected
 * request (token exchange, userinfo, ...) carries:
 *   - a `DPoP` header with a JWT signed by the client's private key
 *   - the proof's JWT header includes `jwk` so the AS/RS can verify it
 *   - the JWT body asserts `htm` (HTTP method), `htu` (full URL minus query/fragment),
 *     `jti` (unique), `iat`, and on resource calls `ath` (base64url-sha256 of access token)
 *
 * Production Singpass v5 mandates DPoP; mockpass uses Bearer. We control which
 * scheme is used via `MyInfoV5ServiceClass` config so the same code targets both.
 *
 * Key management:
 * - One EC P-256 keypair per process. Generated at module load. The tokens we
 *   receive from Singpass are bound to this key's thumbprint — restarting the
 *   process invalidates any in-flight access tokens (max 2 min window, fine).
 * - For multi-instance prod, every replica generates its own keypair. The IdP
 *   doesn't need to know about the keys ahead of time (DPoP is "ephemeral").
 *   What DOES need attention before scaling: if a token is issued by replica A
 *   and the user's next request lands on replica B, the DPoP-bound token won't
 *   validate. The MyInfo auth code → access token → userinfo round trip
 *   happens within one HTTP request (form-view path), so this is OK today.
 *   When that changes, persist the keypair to a shared store.
 */

import crypto from 'crypto'
import type { JWK } from 'jose'
import * as jose from 'jose'

import { assertEcP256PrivateJwk } from './myinfo.v5.crypto'

export interface DpopKeyPair {
  /** Public JWK to be embedded in the DPoP proof JWT header. */
  publicJwk: JWK
  /** Imported key used to sign proofs. */
  privateKey: jose.KeyLike
  /** Thumbprint, base64url-sha256 of the canonical JWK — for cnf.jkt asserts. */
  thumbprint: string
}

/**
 * Generate an EC P-256 keypair suitable for DPoP. ES256 because that's
 * universally supported and what the FAPI 2.0 profile recommends.
 */
export async function generateDpopKeyPair(): Promise<DpopKeyPair> {
  const { publicKey, privateKey } = await jose.generateKeyPair('ES256', {
    extractable: true,
  })
  const publicJwk = await jose.exportJWK(publicKey)
  const thumbprint = await jose.calculateJwkThumbprint(publicJwk, 'sha256')
  return { publicJwk, privateKey, thumbprint }
}

/**
 * Re-hydrate a `DpopKeyPair` from a private JWK persisted to a session store.
 * The public half is derived by stripping the private components, so we don't
 * need to store it twice.
 */
export async function importDpopKeyPair(privateJwk: JWK): Promise<DpopKeyPair> {
  // Reject anything that isn't the EC P-256 private JWK we wrote. Defends
  // against tampered session rows or a future schema drift surfacing the
  // wrong key material to jose.
  assertEcP256PrivateJwk(privateJwk)
  const privateKey = (await jose.importJWK(privateJwk, 'ES256')) as jose.KeyLike
  const {
    d: _d,
    p: _p,
    q: _q,
    dp: _dp,
    dq: _dq,
    qi: _qi,
    ...publicJwk
  } = privateJwk
  void _d
  void _p
  void _q
  void _dp
  void _dq
  void _qi
  const thumbprint = await jose.calculateJwkThumbprint(publicJwk, 'sha256')
  return { publicJwk, privateKey, thumbprint }
}

/**
 * Compute the `ath` claim: base64url(SHA-256(access_token)).
 * Required on DPoP proofs sent to resource endpoints (userinfo).
 */
export function computeAccessTokenHash(accessToken: string): string {
  return crypto
    .createHash('sha256')
    .update(accessToken)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

/**
 * Build a DPoP proof JWT for a given HTTP request.
 *
 * @param keypair   client's DPoP keypair
 * @param htm       HTTP method (e.g. 'POST'); normalised to uppercase
 * @param htu       request URL — strip query and fragment per RFC 9449 §4.2
 * @param accessToken  if present, include `ath` for resource-server calls
 * @param nonce     server-issued DPoP nonce (RFC 9449 §8). Set on retries
 *                  after the AS/RS responds with a `DPoP-Nonce` header.
 */
export async function createDpopProof({
  keypair,
  htm,
  htu,
  accessToken,
  nonce,
  lifetimeSeconds = 120,
}: {
  keypair: DpopKeyPair
  htm: string
  htu: string
  accessToken?: string
  nonce?: string
  lifetimeSeconds?: number
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const url = new URL(htu)
  url.search = ''
  url.hash = ''
  const payload: Record<string, unknown> = {
    htm: htm.toUpperCase(),
    htu: url.toString(),
    jti: crypto.randomUUID(),
    iat: now,
    exp: now + lifetimeSeconds,
  }
  if (accessToken) {
    payload.ath = computeAccessTokenHash(accessToken)
  }
  if (nonce) {
    payload.nonce = nonce
  }
  return new jose.SignJWT(payload)
    .setProtectedHeader({
      typ: 'dpop+jwt',
      alg: 'ES256',
      jwk: keypair.publicJwk,
    })
    .sign(keypair.privateKey)
}
