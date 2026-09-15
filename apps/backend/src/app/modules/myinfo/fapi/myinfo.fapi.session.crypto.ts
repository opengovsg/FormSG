import crypto from 'crypto'
import { compactDecrypt, CompactEncrypt } from 'jose'

import { sessionSecret } from '../../../config/config'

/**
 * Encrypts the secrets a MyInfo FAPI login session holds between requests.
 *
 * Without this, read access to Mongo would yield a live access token and its
 * DPoP key for every login in flight, which is enough to call the FAPI userinfo
 * endpoint directly and retrieve NRICs.
 *
 * Compact JWE (`alg: dir`, `enc: A256GCM`). The AES key is HKDF-derived from
 * SESSION_SECRET so the raw session secret is not used as a cipher key.
 */

const KEY_BYTES = 32
const encoder = new TextEncoder()
const decoder = new TextDecoder()

const secret = new Uint8Array(
  crypto.hkdfSync(
    'sha256',
    sessionSecret,
    'myinfo-fapi-session',
    'v1',
    KEY_BYTES,
  ),
)

export const encrypt = (plaintext: string): Promise<string> => {
  return new CompactEncrypt(encoder.encode(plaintext))
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .encrypt(secret)
}

export const decrypt = async (envelope: string): Promise<string> => {
  const { plaintext } = await compactDecrypt(envelope, secret)
  return decoder.decode(plaintext)
}

export const encryptJwk = (jwk: JsonWebKey): Promise<string> => {
  return encrypt(JSON.stringify(jwk))
}

export const decryptJwk = async (envelope: string): Promise<JsonWebKey> => {
  return JSON.parse(await decrypt(envelope)) as JsonWebKey
}
