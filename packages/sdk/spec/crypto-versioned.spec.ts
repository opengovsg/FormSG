import { adaptV4ToV1 } from '../src/adapt-v4-to-v1'
import Crypto from '../src/crypto'
import CryptoV3 from '../src/crypto-v3'
import { SIGNING_KEYS } from '../src/resource/signing-keys'
import { DecryptedContentV4, FieldResponsesV4 } from '../src/types-v4'

import { decodeUTF8 } from 'tweetnacl-util'

import { encryptMessage } from '../src/util/crypto'

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

  describe('plaintext-shape dispatch', () => {
    // Encrypts arbitrary plaintext (even invalid JSON) inside an MRF envelope.
    const encryptRawInEnvelope = (raw: string, formPublicKey: string) => {
      const envelope = cryptoV3.encrypt({}, formPublicKey)
      return {
        // Encrypt to the submission keypair like the MRF envelope does.
        encryptedContent: encryptMessage(
          decodeUTF8(raw),
          envelope.submissionPublicKey
        ),
        encryptedSubmissionSecretKey: envelope.encryptedSubmissionSecretKey,
        version: MRF_TEST_VERSION,
      }
    }

    it('returns null for a V3-shaped record (no provenance)', () => {
      const { publicKey, secretKey } = crypto.generate()
      const v3Responses = {
        '650abc0000000000000000aa': {
          fieldType: 'textfield',
          answer: 'TAN AH KOW',
        },
      }
      const enc = cryptoV3.encrypt(v3Responses, publicKey)
      const params = {
        encryptedContent: enc.encryptedContent,
        encryptedSubmissionSecretKey: enc.encryptedSubmissionSecretKey,
        version: MRF_TEST_VERSION,
      }

      expect(crypto.decryptVersioned(secretKey, params)).toBeNull()
      expect(crypto.decrypt(secretKey, params)).toBeNull()
    })

    it('returns null for non-JSON plaintext', () => {
      const { publicKey, secretKey } = crypto.generate()
      const params = encryptRawInEnvelope('this is not json {', publicKey)

      expect(crypto.decryptVersioned(secretKey, params)).toBeNull()
      expect(crypto.decrypt(secretKey, params)).toBeNull()
    })

    it.each([
      ['string literal', '"just a string"'],
      ['number literal', '42'],
      ['boolean literal', 'true'],
      ['null literal', 'null'],
    ])('returns null for JSON that is a %s', (_label, raw) => {
      const { publicKey, secretKey } = crypto.generate()
      const params = encryptRawInEnvelope(raw, publicKey)

      expect(crypto.decryptVersioned(secretKey, params)).toBeNull()
      expect(crypto.decrypt(secretKey, params)).toBeNull()
    })

    it('returns null for an array that fails the V1 field validator', () => {
      const { publicKey, secretKey } = crypto.generate()
      const invalidV1 = [{ notAFormField: true }]
      const encryptedContent = crypto.encrypt(invalidV1, publicKey)
      const params = { encryptedContent, version: 1 }

      expect(crypto.decryptVersioned(secretKey, params)).toBeNull()
      expect(crypto.decrypt(secretKey, params)).toBeNull()
    })

    it('decrypt returns null, not partial output, when a later V4 entry is malformed', () => {
      const { publicKey, secretKey } = crypto.generate()
      const responses = {
        ...v4Responses,
        '650abc0000000000000000ac': {
          fieldType: 'checkbox',
          question: 'Broken checkbox',
          // checkbox answers must carry an array value
          answer: { value: 'not-an-array' },
          provenance: { stepNumber: 1 },
        },
      }
      const enc = cryptoV3.encrypt(responses, publicKey)

      expect(
        crypto.decrypt(secretKey, {
          encryptedContent: enc.encryptedContent,
          encryptedSubmissionSecretKey: enc.encryptedSubmissionSecretKey,
          version: MRF_TEST_VERSION,
        })
      ).toBeNull()
    })
  })

  describe('version param remains ignored', () => {
    it.each([0, 4, 999, undefined])(
      'produces identical results for version=%p on V1 and V4 payloads',
      (junkVersion) => {
        const { publicKey, secretKey } = crypto.generate()
        const v1Encrypted = crypto.encrypt(plaintext, publicKey)
        const v4Enc = cryptoV3.encrypt(v4Responses, publicKey)

        const v1WithJunk = crypto.decryptVersioned(secretKey, {
          encryptedContent: v1Encrypted,
          version: junkVersion as unknown as number,
        })
        const v1WithCorrect = crypto.decryptVersioned(secretKey, {
          encryptedContent: v1Encrypted,
          version: 1,
        })
        expect(v1WithJunk).toEqual(v1WithCorrect)

        const v4Params = {
          encryptedContent: v4Enc.encryptedContent,
          encryptedSubmissionSecretKey: v4Enc.encryptedSubmissionSecretKey,
        }
        const v4WithJunk = crypto.decryptVersioned(secretKey, {
          ...v4Params,
          version: junkVersion as unknown as number,
        })
        const v4WithCorrect = crypto.decryptVersioned(secretKey, {
          ...v4Params,
          version: MRF_TEST_VERSION,
        })
        expect(v4WithJunk).toEqual(v4WithCorrect)
        expect(
          crypto.decrypt(secretKey, {
            ...v4Params,
            version: junkVersion as unknown as number,
          })
        ).toEqual(
          crypto.decrypt(secretKey, { ...v4Params, version: MRF_TEST_VERSION })
        )
      }
    )
  })

  describe('key handling', () => {
    it('never returns the form secret key as submissionSecretKey', () => {
      const { publicKey, secretKey } = crypto.generate()
      const enc = cryptoV3.encrypt(v4Responses, publicKey)

      const result = crypto.decryptVersioned(secretKey, {
        encryptedContent: enc.encryptedContent,
        encryptedSubmissionSecretKey: enc.encryptedSubmissionSecretKey,
        version: MRF_TEST_VERSION,
      }) as DecryptedContentV4

      expect(result.submissionSecretKey).toEqual(enc.submissionSecretKey)
      expect(result.submissionSecretKey).not.toEqual(secretKey)
    })

    it('decrypt output has no submissionSecretKey property for either envelope', () => {
      const { publicKey, secretKey } = crypto.generate()
      const v4Enc = cryptoV3.encrypt(v4Responses, publicKey)

      const fromV4 = crypto.decrypt(secretKey, {
        encryptedContent: v4Enc.encryptedContent,
        encryptedSubmissionSecretKey: v4Enc.encryptedSubmissionSecretKey,
        version: MRF_TEST_VERSION,
      })
      const fromV1 = crypto.decrypt(secretKey, {
        encryptedContent: crypto.encrypt(plaintext, publicKey),
        version: 1,
      })

      expect(fromV4).not.toHaveProperty('submissionSecretKey')
      expect(fromV1).not.toHaveProperty('submissionSecretKey')
    })
  })

  describe('cross-implementation consistency', () => {
    it('matches cryptoV3.decryptToV4 for the same MRF V4 payload', () => {
      const { publicKey, secretKey } = crypto.generate()
      const enc = cryptoV3.encrypt(v4Responses, publicKey)
      const params = {
        encryptedContent: enc.encryptedContent,
        encryptedSubmissionSecretKey: enc.encryptedSubmissionSecretKey,
        version: MRF_TEST_VERSION,
      }

      const versioned = crypto.decryptVersioned(
        secretKey,
        params
      ) as DecryptedContentV4
      const viaV3 = cryptoV3.decryptToV4(secretKey, params, {})

      expect(versioned.responses).toEqual(viaV3!.responses)
      expect(versioned.submissionSecretKey).toEqual(viaV3!.submissionSecretKey)
    })

    it('decrypt equals the V4 arm of decryptVersioned run through adaptV4ToV1', () => {
      const { publicKey, secretKey } = crypto.generate()
      const enc = cryptoV3.encrypt(v4Responses, publicKey)
      const params = {
        encryptedContent: enc.encryptedContent,
        encryptedSubmissionSecretKey: enc.encryptedSubmissionSecretKey,
        version: MRF_TEST_VERSION,
      }

      const adapted = crypto.decrypt(secretKey, params)
      const versioned = crypto.decryptVersioned(
        secretKey,
        params
      ) as DecryptedContentV4

      expect(adapted).toEqual({ responses: adaptV4ToV1(versioned.responses) })
    })
  })

  describe('verified content', () => {
    const mockVerifiedContent = {
      uinFin: 'S12345679Z',
      somethingElse: 99,
    }
    const signingSecretKey = SIGNING_KEYS.test.secretKey

    it('round-trips verified content in the V1 arm and stays absent when not given', () => {
      const { publicKey, secretKey } = crypto.generate()
      const encryptedContent = crypto.encrypt(plaintext, publicKey)
      const verifiedContent = crypto.encrypt(
        mockVerifiedContent,
        publicKey,
        signingSecretKey
      )

      const withVerified = crypto.decryptVersioned(secretKey, {
        encryptedContent,
        verifiedContent,
        version: 1,
      })
      expect(withVerified).toEqual({
        responses: plaintext,
        verified: mockVerifiedContent,
      })

      const withoutVerified = crypto.decryptVersioned(secretKey, {
        encryptedContent,
        version: 1,
      })
      expect(withoutVerified).not.toHaveProperty('verified')
    })

    it('round-trips verified content in the V4 arm (and through decrypt) and stays absent when not given', () => {
      const { publicKey, secretKey } = crypto.generate()
      const enc = cryptoV3.encrypt(v4Responses, publicKey)
      // MRF verified content is encrypted with the submission public key.
      const verifiedContent = crypto.encrypt(
        mockVerifiedContent,
        enc.submissionPublicKey,
        signingSecretKey
      )
      const params = {
        encryptedContent: enc.encryptedContent,
        encryptedSubmissionSecretKey: enc.encryptedSubmissionSecretKey,
        version: MRF_TEST_VERSION,
      }

      const versioned = crypto.decryptVersioned(secretKey, {
        ...params,
        verifiedContent,
      })
      expect(versioned).toHaveProperty('verified', mockVerifiedContent)
      expect(versioned!.responses).toEqual(v4Responses)

      const adapted = crypto.decrypt(secretKey, {
        ...params,
        verifiedContent,
      })
      expect(adapted).toHaveProperty('verified', mockVerifiedContent)

      expect(crypto.decryptVersioned(secretKey, params)).not.toHaveProperty(
        'verified'
      )
      expect(crypto.decrypt(secretKey, params)).not.toHaveProperty('verified')
    })
  })
})
