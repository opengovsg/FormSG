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

/**
 * Encrypted-at-rest envelope for a JWK. AES-256-GCM with a key derived from
 * the supplied secret via PBKDF2-SHA256. Fresh per-record salt + IV so two
 * identical JWKs never encrypt to the same ciphertext.
 *
 * Envelope: `v1.<salt>.<iv>.<tag>.<ciphertext>` — five base64url segments,
 * dot-delimited. The leading version tag lets us rotate algorithms later
 * without ambiguity. PBKDF2 iteration count is conservative for a high-entropy
 * input like `sessionSecret`; a stronger KDF isn't required here, but PBKDF2
 * is what the surrounding code already uses for key stretching.
 */
const JWK_ENCRYPT_VERSION = 'v1'
const JWK_ENCRYPT_SALT_BYTES = 16
const JWK_ENCRYPT_IV_BYTES = 12
const JWK_ENCRYPT_KEY_BYTES = 32
const JWK_ENCRYPT_PBKDF2_ITERATIONS = 100_000
const JWK_ENCRYPT_PBKDF2_DIGEST = 'sha256'

function deriveJwkEncryptionKey(secret: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    secret,
    salt,
    JWK_ENCRYPT_PBKDF2_ITERATIONS,
    JWK_ENCRYPT_KEY_BYTES,
    JWK_ENCRYPT_PBKDF2_DIGEST,
  )
}

export function encryptJwkAtRest(jwk: JWK, secret: string): string {
  const salt = crypto.randomBytes(JWK_ENCRYPT_SALT_BYTES)
  const iv = crypto.randomBytes(JWK_ENCRYPT_IV_BYTES)
  const key = deriveJwkEncryptionKey(secret, salt)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const plaintext = Buffer.from(JSON.stringify(jwk), 'utf8')
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()
  return [
    JWK_ENCRYPT_VERSION,
    salt.toString('base64url'),
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.')
}

export function decryptJwkAtRest(envelope: string, secret: string): JWK {
  const parts = envelope.split('.')
  if (parts.length !== 5 || parts[0] !== JWK_ENCRYPT_VERSION) {
    // eslint-disable-next-line typesafe/no-throw-sync-func
    throw new Error('Unsupported encrypted JWK envelope')
  }
  const [, saltB64, ivB64, tagB64, ciphertextB64] = parts
  const salt = Buffer.from(saltB64, 'base64url')
  const iv = Buffer.from(ivB64, 'base64url')
  const tag = Buffer.from(tagB64, 'base64url')
  const ciphertext = Buffer.from(ciphertextB64, 'base64url')
  const key = deriveJwkEncryptionKey(secret, salt)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])
  return JSON.parse(plaintext.toString('utf8')) as JWK
}

/**
 * Defense-in-depth shape check before handing a persisted private JWK to
 * `jose.importJWK`. Catches DB rows that have been tampered with into
 * pointing at unexpected key material (different curve, different kty, or
 * a public-only JWK missing `d`).
 */
export function assertEcP256PrivateJwk(jwk: unknown): asserts jwk is JWK {
  const j = jwk as Partial<JWK> | null
  if (
    !j ||
    typeof j !== 'object' ||
    j.kty !== 'EC' ||
    j.crv !== 'P-256' ||
    typeof j.x !== 'string' ||
    typeof j.y !== 'string' ||
    typeof j.d !== 'string'
  ) {
    // eslint-disable-next-line typesafe/no-throw-sync-func
    throw new Error('Expected EC P-256 private JWK')
  }
}
