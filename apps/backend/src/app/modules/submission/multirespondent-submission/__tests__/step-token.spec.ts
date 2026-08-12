import nacl from 'tweetnacl'
import { decodeBase64, encodeBase64, encodeUTF8 } from 'tweetnacl-util'

import * as stepToken from '../step-token'

/**
 * Client-side unwrap, mirroring how an admin holding the form secret key would
 * recover the raw token from `encryptedStepToken` to resend a reminder. The
 * server never does this — it only ever holds the form public key.
 */
const unwrapStepToken = (
  encryptedStepToken: string,
  formSecretKey: string,
): string | null => {
  const [senderPublicKey, nonceAndCipher] = encryptedStepToken.split(';')
  const [nonce, cipher] = nonceAndCipher.split(':').map(decodeBase64)
  const opened = nacl.box.open(
    cipher,
    nonce,
    decodeBase64(senderPublicKey),
    decodeBase64(formSecretKey),
  )
  return opened ? encodeUTF8(opened) : null
}

describe('step-token primitive', () => {
  describe('generate', () => {
    it('should generate a URL-safe token with at least 256 bits of entropy', () => {
      // Act
      const token = stepToken.generate()

      // Assert: base64url of 32 bytes (256 bits) is 43 chars, no padding/unsafe chars
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
      const decodedByteLength = Buffer.from(token, 'base64url').length
      expect(decodedByteLength).toBeGreaterThanOrEqual(32)
    })

    it('should generate a unique token on each call', () => {
      const tokens = new Set(
        Array.from({ length: 100 }, () => stepToken.generate()),
      )
      expect(tokens.size).toBe(100)
    })
  })

  describe('hash', () => {
    it('should produce a lowercase hex sha256 digest', () => {
      // 'test' sha256 is a well-known vector; proves plain sha256, no salt.
      expect(stepToken.hash('test')).toBe(
        '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      )
    })

    it('should be deterministic and unsalted (same input -> same digest)', () => {
      const token = stepToken.generate()
      expect(stepToken.hash(token)).toBe(stepToken.hash(token))
    })

    it('should produce different digests for different tokens', () => {
      expect(stepToken.hash(stepToken.generate())).not.toBe(
        stepToken.hash(stepToken.generate()),
      )
    })
  })

  describe('verify', () => {
    it('should return true when the raw token matches the stored hash', () => {
      const token = stepToken.generate()
      expect(stepToken.verify(token, stepToken.hash(token))).toBe(true)
    })

    it('should return false when the raw token is tampered', () => {
      const token = stepToken.generate()
      const otherToken = stepToken.generate()
      expect(stepToken.verify(otherToken, stepToken.hash(token))).toBe(false)
    })

    it('should return false when the stored hash is truncated', () => {
      const token = stepToken.generate()
      const truncatedHash = stepToken.hash(token).slice(0, -2)
      expect(stepToken.verify(token, truncatedHash)).toBe(false)
    })

    it('should return false for an empty or malformed stored hash', () => {
      const token = stepToken.generate()
      expect(stepToken.verify(token, '')).toBe(false)
      expect(stepToken.verify(token, 'not-hex-zzzz')).toBe(false)
    })
  })

  describe('wrap', () => {
    const formKeypair = nacl.box.keyPair()
    const formPublicKey = encodeBase64(formKeypair.publicKey)
    const formSecretKey = encodeBase64(formKeypair.secretKey)

    it('should round-trip: unwrapping with the form secret key recovers a token that verifies against the stored hash', () => {
      // Arrange
      const rawToken = stepToken.generate()
      const storedHash = stepToken.hash(rawToken)

      // Act
      const encryptedStepToken = stepToken.wrap(rawToken, formPublicKey)
      const recovered = unwrapStepToken(encryptedStepToken, formSecretKey)

      // Assert
      expect(recovered).toBe(rawToken)
      expect(stepToken.verify(recovered as string, storedHash)).toBe(true)
    })

    it('should not be unwrappable with the wrong secret key', () => {
      const rawToken = stepToken.generate()
      const encryptedStepToken = stepToken.wrap(rawToken, formPublicKey)
      const wrongSecretKey = encodeBase64(nacl.box.keyPair().secretKey)
      expect(unwrapStepToken(encryptedStepToken, wrongSecretKey)).toBeNull()
    })

    it('should produce a fresh ciphertext each call (random nonce)', () => {
      const rawToken = stepToken.generate()
      expect(stepToken.wrap(rawToken, formPublicKey)).not.toBe(
        stepToken.wrap(rawToken, formPublicKey),
      )
    })
  })
})
