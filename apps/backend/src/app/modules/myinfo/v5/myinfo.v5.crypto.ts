import crypto from 'crypto'
import type { JSONWebKeySet, JWK, KeyLike } from 'jose'
import * as jose from 'jose'

/**
 * Generate a PKCE code_verifier (RFC 7636 §4.1) of 64 url-safe-base64 chars.
 * 43-128 chars is the spec range; we pick 64 for headroom.
 */
export function generatePkceVerifier(): string {
  return base64urlEncode(crypto.randomBytes(48))
}

/**
 * Derive the S256 code_challenge from a verifier per RFC 7636 §4.2.
 */
export function deriveCodeChallenge(verifier: string): string {
  return base64urlEncode(crypto.createHash('sha256').update(verifier).digest())
}

/**
 * Cryptographically random state/nonce.
 */
export function generateNonce(): string {
  return base64urlEncode(crypto.randomBytes(32))
}

function base64urlEncode(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

/**
 * Pick a key from a JWKS by `use` (sig|enc). Returns undefined if not found —
 * callers should surface this as a config error.
 */
export function pickJwk(
  jwks: JSONWebKeySet,
  use: 'sig' | 'enc',
): JWK | undefined {
  return jwks.keys.find((k) => k.use === use)
}

/** Strict pickJwk that throws — only for synchronous boot-time code paths. */
export function requireJwk(jwks: JSONWebKeySet, use: 'sig' | 'enc'): JWK {
  const found = pickJwk(jwks, use)
  if (!found) {
    // eslint-disable-next-line typesafe/no-throw-sync-func
    throw new Error(`No JWK with use=${use} in keyset`)
  }
  return found
}

/**
 * Build the JWT used as `client_assertion` for `private_key_jwt`
 * token-endpoint authentication (RFC 7523 §2.2).
 */
export async function createClientAssertion({
  clientId,
  audience,
  signingKey,
  signingKid,
  signingAlg = 'ES256',
  lifetimeSeconds = 60,
}: {
  clientId: string
  /** OIDC token endpoint URL OR issuer — Singpass v5 uses issuer. */
  audience: string
  signingKey: KeyLike
  signingKid: string
  signingAlg?: string
  lifetimeSeconds?: number
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return new jose.SignJWT({})
    .setProtectedHeader({ alg: signingAlg, typ: 'JWT', kid: signingKid })
    .setIssuer(clientId)
    .setSubject(clientId)
    .setAudience(audience)
    .setIssuedAt(now)
    .setExpirationTime(now + lifetimeSeconds)
    .setJti(crypto.randomUUID())
    .sign(signingKey)
}
