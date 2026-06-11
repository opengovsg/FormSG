import Crypto from '../src/crypto'
import CryptoV3 from '../src/crypto-v3'
import { SIGNING_KEYS } from '../src/resource/signing-keys'
import { DecryptedContentV4, FieldResponsesV4 } from '../src/types-v4'

import { plaintext } from './resources/crypto-data-20200322'

const signingPublicKey = SIGNING_KEYS.test.publicKey

const MRF_TEST_VERSION = 3

const v4Responses: FieldResponsesV4 = {
  '650abc0000000000000000aa': {
    fieldType: 'textfield',
    question: 'What is your name?',
    answer: { value: 'TAN AH KOW' },
    provenance: { stepNumber: 1 },
  },
  '650abc0000000000000000ab': {
    fieldType: 'radiobutton',
    question: 'Favourite colour',
    answer: { value: 'vermilion', isOthersInput: true },
    provenance: { stepNumber: 2 },
  },
}

describe('Crypto (versioned decryption)', () => {
  const crypto = new Crypto({ signingPublicKey })
  const cryptoV3 = new CryptoV3({ signingPublicKey })

  it('decryptVersioned returns the V4 arm with the per-submission secret key for an MRF V4 payload', () => {
    const { publicKey, secretKey } = crypto.generate()
    const enc = cryptoV3.encrypt(v4Responses, publicKey)

    const result = crypto.decryptVersioned(secretKey, {
      encryptedContent: enc.encryptedContent,
      encryptedSubmissionSecretKey: enc.encryptedSubmissionSecretKey,
      version: MRF_TEST_VERSION,
    })

    expect(result).not.toBeNull()
    expect(Array.isArray(result!.responses)).toBe(false)
    expect(result!.responses).toEqual(v4Responses)
    expect((result as DecryptedContentV4).submissionSecretKey).toEqual(
      enc.submissionSecretKey
    )
  })

  it('decryptVersioned returns the V1 arm for a storage-mode payload, with no submissionSecretKey property', () => {
    const { publicKey, secretKey } = crypto.generate()
    const encryptedContent = crypto.encrypt(plaintext, publicKey)

    const result = crypto.decryptVersioned(secretKey, {
      encryptedContent,
      version: 1,
    })

    expect(result).not.toBeNull()
    expect(Array.isArray(result!.responses)).toBe(true)
    expect(result!.responses).toEqual(plaintext)
    expect(result).not.toHaveProperty('submissionSecretKey')
  })

  it('decrypt adapts an MRF V4 payload to V1 DecryptedContent without key material', () => {
    const { publicKey, secretKey } = crypto.generate()
    const enc = cryptoV3.encrypt(v4Responses, publicKey)

    const result = crypto.decrypt(secretKey, {
      encryptedContent: enc.encryptedContent,
      encryptedSubmissionSecretKey: enc.encryptedSubmissionSecretKey,
      version: MRF_TEST_VERSION,
    })

    expect(result).toEqual({
      responses: [
        {
          _id: '650abc0000000000000000aa',
          question: 'What is your name?',
          fieldType: 'textfield',
          answer: 'TAN AH KOW',
        },
        {
          _id: '650abc0000000000000000ab',
          question: 'Favourite colour',
          fieldType: 'radiobutton',
          answer: 'Others: vermilion',
        },
      ],
    })
    expect(result).not.toHaveProperty('submissionSecretKey')
  })

  it('treats an MRF payload with an empty record as a valid empty V4 submission', () => {
    const { publicKey, secretKey } = crypto.generate()
    const enc = cryptoV3.encrypt({}, publicKey)
    const params = {
      encryptedContent: enc.encryptedContent,
      encryptedSubmissionSecretKey: enc.encryptedSubmissionSecretKey,
      version: MRF_TEST_VERSION,
    }

    const versioned = crypto.decryptVersioned(secretKey, params)
    expect(versioned).toEqual({
      submissionSecretKey: enc.submissionSecretKey,
      responses: {},
    })

    const adapted = crypto.decrypt(secretKey, params)
    expect(adapted).toEqual({ responses: [] })
  })

  describe('envelope/content mismatches', () => {
    it('returns null for an MRF payload when encryptedSubmissionSecretKey is not given', () => {
      const { publicKey, secretKey } = crypto.generate()
      const enc = cryptoV3.encrypt(v4Responses, publicKey)
      const params = {
        encryptedContent: enc.encryptedContent,
        version: MRF_TEST_VERSION,
      }

      expect(crypto.decryptVersioned(secretKey, params)).toBeNull()
      expect(crypto.decrypt(secretKey, params)).toBeNull()
    })

    it('returns null for a storage-mode payload carrying a spurious encryptedSubmissionSecretKey', () => {
      const { publicKey, secretKey } = crypto.generate()
      const encryptedContent = crypto.encrypt(plaintext, publicKey)
      // A validly-enveloped submission key that did not encrypt this content.
      const spuriousEnvelope = cryptoV3.encrypt({}, publicKey)
      const params = {
        encryptedContent,
        encryptedSubmissionSecretKey:
          spuriousEnvelope.encryptedSubmissionSecretKey,
        version: 1,
      }

      expect(crypto.decryptVersioned(secretKey, params)).toBeNull()
      expect(crypto.decrypt(secretKey, params)).toBeNull()
    })

    it('returns null when encryptedSubmissionSecretKey is corrupt or encrypted for another key', () => {
      const { publicKey, secretKey } = crypto.generate()
      const otherKeypair = crypto.generate()
      const enc = cryptoV3.encrypt(v4Responses, publicKey)
      const wrongKeyEnvelope = cryptoV3.encrypt(v4Responses, otherKeypair.publicKey)

      const corrupt = {
        encryptedContent: enc.encryptedContent,
        encryptedSubmissionSecretKey: 'utterly;corrupt:envelope',
        version: MRF_TEST_VERSION,
      }
      const wrongKey = {
        encryptedContent: enc.encryptedContent,
        encryptedSubmissionSecretKey: wrongKeyEnvelope.encryptedSubmissionSecretKey,
        version: MRF_TEST_VERSION,
      }

      expect(crypto.decryptVersioned(secretKey, corrupt)).toBeNull()
      expect(crypto.decrypt(secretKey, corrupt)).toBeNull()
      expect(crypto.decryptVersioned(secretKey, wrongKey)).toBeNull()
      expect(crypto.decrypt(secretKey, wrongKey)).toBeNull()
    })

    it('returns null for tampered ciphertext and wrong form secret key in both arms', () => {
      const { publicKey, secretKey } = crypto.generate()
      const otherKeypair = crypto.generate()

      const v1Encrypted = crypto.encrypt(plaintext, publicKey)
      const v4Enc = cryptoV3.encrypt(v4Responses, publicKey)

      const tamper = (content: string) => {
        const flipped = content.slice(0, -4) + (content.endsWith('AAAA') ? 'BBBB' : 'AAAA')
        return flipped
      }

      expect(
        crypto.decryptVersioned(secretKey, {
          encryptedContent: tamper(v1Encrypted),
          version: 1,
        })
      ).toBeNull()
      expect(
        crypto.decryptVersioned(secretKey, {
          encryptedContent: tamper(v4Enc.encryptedContent),
          encryptedSubmissionSecretKey: v4Enc.encryptedSubmissionSecretKey,
          version: MRF_TEST_VERSION,
        })
      ).toBeNull()
      expect(
        crypto.decryptVersioned(otherKeypair.secretKey, {
          encryptedContent: v1Encrypted,
          version: 1,
        })
      ).toBeNull()
      expect(
        crypto.decryptVersioned(otherKeypair.secretKey, {
          encryptedContent: v4Enc.encryptedContent,
          encryptedSubmissionSecretKey: v4Enc.encryptedSubmissionSecretKey,
          version: MRF_TEST_VERSION,
        })
      ).toBeNull()
    })
  })
})
