import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import nacl from 'tweetnacl'
import { decodeBase64, decodeUTF8, encodeBase64 } from 'tweetnacl-util'

const TOKEN_BYTES = 32

export const generate = (): string =>
  randomBytes(TOKEN_BYTES).toString('base64url')

export const hash = (rawToken: string): string =>
  createHash('sha256').update(rawToken).digest('hex')

/**
 * Verify a presented raw token against a stored hash in constant time.
 */
export const verify = (rawToken: string, storedHash: string): boolean => {
  const computed = Buffer.from(hash(rawToken), 'hex')
  const stored = Buffer.from(storedHash, 'hex')
  if (computed.length !== stored.length || stored.length === 0) {
    return false
  }
  return timingSafeEqual(computed, stored)
}

/**
 * Wrap a raw token to the form's public key, producing `encryptedStepToken`.
 *
 * Uses the same scheme as `encryptedSubmissionSecretKey`. However, it is defined here so
 * that the SDK does not expose the wrapping logic to public clients.
 */
export const wrap = (rawToken: string, formPublicKey: string): string => {
  const ephemeralKeypair = nacl.box.keyPair()
  const nonce = nacl.randomBytes(nacl.box.nonceLength)
  const ciphertext = nacl.box(
    decodeUTF8(rawToken),
    nonce,
    decodeBase64(formPublicKey),
    ephemeralKeypair.secretKey,
  )
  return `${encodeBase64(ephemeralKeypair.publicKey)};${encodeBase64(
    nonce,
  )}:${encodeBase64(ciphertext)}`
}
