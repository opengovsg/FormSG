import crypto from 'crypto'

import { sessionSecret } from '../../../config/config'

/**
 * Encrypts the secrets a MyInfo FAPI login session holds between requests.
 *
 * Without this, read access to Mongo would yield a live access token and its
 * DPoP key for every login in flight, which is enough to call the FAPI userinfo
 * endpoint directly and retrieve NRICs.
 *
 * Envelope format is `<version>.<iv>.<ciphertext>.<authTag>`, base64url, with the
 * version bound as additional authenticated data so an envelope cannot be
 * replayed under a future format.
 */

const ENVELOPE_VERSION = 'v1'
const KEY_BYTES = 32
const IV_BYTES = 12
const AUTH_TAG_BYTES = 16
const CIPHER = 'aes-256-gcm'

const key = Buffer.from(
  crypto.hkdfSync(
    'sha256',
    sessionSecret,
    'myinfo-fapi-session',
    ENVELOPE_VERSION,
    KEY_BYTES,
  ),
)

export const encrypt = (plaintext: string): string => {
  const iv = crypto.randomBytes(IV_BYTES)
  const cipher = crypto.createCipheriv(CIPHER, key, iv, {
    authTagLength: AUTH_TAG_BYTES,
  })
  cipher.setAAD(Buffer.from(ENVELOPE_VERSION))
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return [
    ENVELOPE_VERSION,
    iv.toString('base64url'),
    ciphertext.toString('base64url'),
    authTag.toString('base64url'),
  ].join('.')
}

export const decrypt = (envelope: string): string => {
  const parts = envelope.split('.')
  const version = parts[0]
  const iv = parts[1]
  const ciphertext = parts[2]
  const authTag = parts[3]
  if (version !== ENVELOPE_VERSION || !iv || !ciphertext || !authTag) {
    // eslint-disable-next-line typesafe/no-throw-sync-func
    throw new Error('Malformed MyInfo FAPI session envelope')
  }
  const decipher = crypto.createDecipheriv(
    CIPHER,
    key,
    Buffer.from(iv, 'base64url'),
    { authTagLength: AUTH_TAG_BYTES },
  )
  decipher.setAAD(Buffer.from(ENVELOPE_VERSION))
  decipher.setAuthTag(Buffer.from(authTag, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}

export const encryptJwk = (jwk: JsonWebKey): string => {
  return encrypt(JSON.stringify(jwk))
}

export const decryptJwk = (envelope: string): JsonWebKey => {
  return JSON.parse(decrypt(envelope)) as JsonWebKey
}
