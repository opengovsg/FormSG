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
})
