import bcrypt from 'bcrypt'
import crypto from 'crypto'

import { sessionSecret } from '../../config/config'

const HMAC_HASH_PREFIX = 'hmac1:'

let hmacKey: Buffer | undefined
const getHmacKey = (): Buffer => {
  hmacKey ??= Buffer.from(
    crypto.hkdfSync('sha256', sessionSecret, 'myinfo-field-hash', 'v1', 32),
  )
  return hmacKey
}

const hmacDigest = (hashKey: string, value: string): Buffer =>
  crypto
    .createHmac('sha256', getHmacKey())
    .update(`${hashKey}\0${value}`)
    .digest()

/**
 * Hashes a MyInfo-verified value, bound to the key it is stored under in
 * MyInfoHash.fields.
 */
export const hashMyInfoValue = (hashKey: string, value: string): string =>
  `${HMAC_HASH_PREFIX}${hmacDigest(hashKey, value).toString('hex')}`

/**
 * Checks a submitted value against a stored MyInfo hash. Accepts both HMAC
 * hashes from hashMyInfoValue and legacy bcrypt hashes.
 */
export const compareMyInfoValue = (
  hashKey: string,
  value: string,
  hash: string,
): Promise<boolean> => {
  if (!hash.startsWith(HMAC_HASH_PREFIX)) {
    return bcrypt.compare(value, hash)
  }
  const expected = hmacDigest(hashKey, value)
  const actual = Buffer.from(hash.slice(HMAC_HASH_PREFIX.length), 'hex')
  return Promise.resolve(
    actual.length === expected.length &&
      crypto.timingSafeEqual(actual, expected),
  )
}
