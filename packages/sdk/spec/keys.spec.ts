import { SIGNING_KEYS } from '../src/resource/signing-keys'
import { VERIFICATION_KEYS } from '../src/resource/verification-keys'

describe('Key lengths', () => {
  // ED25519 key lengths in base64
  const PUBLIC_KEY_LENGTH = 44
  const SECRET_KEY_LENGTH = 88

  describe('Verification keys', () => {
    describe('Public keys', () => {
      it('should have the correct length for ED25519 public keys', () => {
        expect(VERIFICATION_KEYS.development.publicKey).toHaveLength(
          PUBLIC_KEY_LENGTH
        )
        expect(VERIFICATION_KEYS.test.publicKey).toHaveLength(PUBLIC_KEY_LENGTH)
        expect(VERIFICATION_KEYS.staging.publicKey).toHaveLength(
          PUBLIC_KEY_LENGTH
        )
        expect(VERIFICATION_KEYS.production.publicKey).toHaveLength(
          PUBLIC_KEY_LENGTH
        )
      })
    })

    describe('Secret keys', () => {
      it('should have the correct length for ED25519 secret keys in test and dev mode', () => {
        expect(VERIFICATION_KEYS.development.secretKey).toHaveLength(
          SECRET_KEY_LENGTH
        )
        expect(VERIFICATION_KEYS.test.secretKey).toHaveLength(SECRET_KEY_LENGTH)
      })
    })
  })

  describe('Signing keys', () => {
    describe('Public keys', () => {
      it('should have the correct length for ED25519 public keys', () => {
        expect(SIGNING_KEYS.development.publicKey).toHaveLength(
          PUBLIC_KEY_LENGTH
        )
        expect(SIGNING_KEYS.test.publicKey).toHaveLength(PUBLIC_KEY_LENGTH)
        expect(SIGNING_KEYS.staging.publicKey).toHaveLength(PUBLIC_KEY_LENGTH)
        expect(SIGNING_KEYS.production.publicKey).toHaveLength(
          PUBLIC_KEY_LENGTH
        )
      })
    })

    describe('Secret keys', () => {
      it('should have the correct length for ED25519 secret keys in test and dev mode', () => {
        expect(SIGNING_KEYS.development.secretKey).toHaveLength(
          SECRET_KEY_LENGTH
        )
        expect(SIGNING_KEYS.test.secretKey).toHaveLength(SECRET_KEY_LENGTH)
      })
    })
  })
})
