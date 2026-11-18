import mockAxios from 'jest-mock-axios'

import Crypto from '../src/crypto'
import CryptoV3 from '../src/crypto-v3'
import { SIGNING_KEYS } from '../src/resource/signing-keys'
import { encryptMessage } from '../src/util/crypto'
import { decodeUTF8 } from '../src/util/encoding'

import {
  ciphertext,
  formPublicKey,
  formSecretKey,
  plaintext,
  plainVerifiedText,
  submissionSecretKey,
} from './resources/crypto-v3-data-20231207'

const INTERNAL_TEST_VERSION = 3

const testFileBuffer = new Uint8Array(Buffer.from('./resources/ogp.svg'))

const encryptionPublicKey = SIGNING_KEYS.test.publicKey
const signingSecretKey = SIGNING_KEYS.test.secretKey

jest.mock('axios', () => mockAxios)

describe('CryptoV3', function () {
  afterEach(() => mockAxios.reset())

  const crypto = new CryptoV3({ signingPublicKey: encryptionPublicKey })
  const cryptoV1 = new Crypto({ signingPublicKey: encryptionPublicKey })

  it('should generate a keypair', () => {
    const keypair = crypto.generate()
    expect(keypair).toHaveProperty('secretKey')
    expect(keypair).toHaveProperty('publicKey')
  })

  it('should generate a keypair that is valid', () => {
    const { publicKey, secretKey } = crypto.generate()
    expect(crypto.valid(publicKey, secretKey)).toBe(true)
  })

  it('should validate an existing keypair', () => {
    expect(crypto.valid(formPublicKey, formSecretKey)).toBe(true)
  })

  it('should invalidate unassociated keypairs', () => {
    // Act
    const { secretKey } = crypto.generate()
    const { publicKey } = crypto.generate()

    // Assert
    expect(crypto.valid(publicKey, secretKey)).toBe(false)
  })

  it('should return null on unsuccessful decryption from form secret key', () => {
    expect(
      crypto.decrypt('random', {
        ...ciphertext,
        version: INTERNAL_TEST_VERSION,
      })
    ).toBe(null)
  })

  it('should return null when successfully decrypted content from form secret key does not fit FormFieldV3 type shape', () => {
    // Arrange
    const { publicKey, secretKey } = crypto.generate()
    const malformedContent = 'just a string, not an object with FormField shape'
    const malformedEncrypt = crypto.encrypt(malformedContent, publicKey)

    // Assert
    // Using correct secret key, but the decrypted object should not fit the
    // expected shape and thus return null.
    expect(
      crypto.decrypt(secretKey, {
        ...malformedEncrypt,
        version: INTERNAL_TEST_VERSION,
      })
    ).toBe(null)
  })

  it('should be able to encrypt and decrypt submissions from 2023-12-07 end-to-end successfully from the form private key', () => {
    // Arrange
    const { publicKey, secretKey } = crypto.generate()

    // Act
    const ciphertext = crypto.encrypt(plaintext, publicKey)
    const decrypted = crypto.decrypt(secretKey, {
      ...ciphertext,
      version: INTERNAL_TEST_VERSION,
    })
    // Assert
    expect(decrypted).toHaveProperty('responses', plaintext)
  })

  it('should be able to decrypt submissions from 2023-12-07 from the submission private key', () => {
    // Act
    const decrypted = crypto.decryptFromSubmissionKey(submissionSecretKey, {
      encryptedContent: ciphertext.encryptedContent,
      version: INTERNAL_TEST_VERSION,
    })
    // Assert
    expect(decrypted).toHaveProperty('responses', plaintext)
  })

  describe('decryptToV4 — MRF step-token recovery', () => {
    const rawStepToken = 'raw-step-token-value_123'

    it('recovers the raw step token when encryptedStepToken is present', () => {
      // Arrange
      const { publicKey, secretKey } = crypto.generate()
      const ciphertext = crypto.encrypt(plaintext, publicKey)
      const encryptedStepToken = encryptMessage(
        decodeUTF8(rawStepToken),
        publicKey
      )

      // Act
      const decrypted = crypto.decryptToV4(
        secretKey,
        { ...ciphertext, encryptedStepToken, version: INTERNAL_TEST_VERSION },
        {}
      )

      // Assert
      expect(decrypted?.stepToken).toBe(rawStepToken)
      expect(decrypted?.responses).toBeDefined()
    })

    it('returns stepToken undefined when encryptedStepToken is absent', () => {
      // Arrange
      const { publicKey, secretKey } = crypto.generate()
      const ciphertext = crypto.encrypt(plaintext, publicKey)

      // Act
      const decrypted = crypto.decryptToV4(
        secretKey,
        { ...ciphertext, version: INTERNAL_TEST_VERSION },
        {}
      )

      // Assert
      expect(decrypted?.stepToken).toBeUndefined()
      expect(decrypted?.responses).toBeDefined()
    })

    it('returns stepToken undefined without failing the decrypt when encryptedStepToken is tampered', () => {
      // Arrange
      const { publicKey, secretKey } = crypto.generate()
      const ciphertext = crypto.encrypt(plaintext, publicKey)
      // Wrapped to an unrelated key, so it cannot be unwrapped with `secretKey`.
      const { publicKey: otherPublicKey } = crypto.generate()
      const encryptedStepToken = encryptMessage(
        decodeUTF8(rawStepToken),
        otherPublicKey
      )

      // Act
      const decrypted = crypto.decryptToV4(
        secretKey,
        { ...ciphertext, encryptedStepToken, version: INTERNAL_TEST_VERSION },
        {}
      )

      // Assert: decrypt still succeeds, step token just comes back undefined.
      expect(decrypted).not.toBeNull()
      expect(decrypted?.stepToken).toBeUndefined()
      expect(decrypted?.responses).toBeDefined()
    })
  })

  it('should be able to encrypt and decrypt files end-to-end', async () => {
    // Arrange
    const { publicKey, secretKey } = crypto.generate()

    // Act
    // Encrypt
    const encrypted = await crypto.encryptFile(testFileBuffer, publicKey)
    expect(encrypted).toHaveProperty('submissionPublicKey')
    expect(encrypted).toHaveProperty('nonce')
    expect(encrypted).toHaveProperty('binary')

    // Decrypt
    const decrypted = await crypto.decryptFile(secretKey, encrypted)

    if (!decrypted) {
      throw new Error('File should be able to decrypt successfully.')
    }

    // Compare
    expect(testFileBuffer).toEqual(decrypted)
  })

  it('should return null if file could not be decrypted', async () => {
    const { publicKey, secretKey } = crypto.generate()

    const encrypted = await crypto.encryptFile(testFileBuffer, publicKey)
    // Rewrite binary with invalid Uint8Array.
    encrypted.binary = new Uint8Array([1, 2])

    const decrypted = await crypto.decryptFile(secretKey, encrypted)

    expect(decrypted).toBeNull()
  })

  it('should be able to encrypt and decrypt submissions with verifiedContent from 2023-12-07 end-to-end successfully from the form private key', () => {
    // Arrange
    const { publicKey, secretKey } = crypto.generate()

    // Act
    const ciphertext = crypto.encrypt(plaintext, publicKey)
    const verifiedText = cryptoV1.encrypt(
      plainVerifiedText,
      ciphertext.submissionPublicKey,
      signingSecretKey
    )
    const decrypted = crypto.decrypt(secretKey, {
      ...ciphertext,
      verifiedContent: verifiedText,
      version: INTERNAL_TEST_VERSION,
    })
    // Assert
    expect(decrypted).toHaveProperty('responses', plaintext)
    expect(decrypted).toHaveProperty('verified', plainVerifiedText)
  })

  describe('decryptToV4', () => {
    describe('webhook question metadata', () => {
      const createWebhook = () => {
        const { publicKey, secretKey } = crypto.generate()
        const responses = {
          name: {
            fieldType: 'textfield',
            answer: { value: 'Jane' },
            provenance: {},
          },
          country: {
            fieldType: 'dropdown',
            answer: { value: 'MALAYSIA' },
            provenance: {},
          },
          existing: {
            fieldType: 'textfield',
            answer: { value: 'x' },
            question: 'Encrypted question',
            provenance: {},
          },
        }
        return {
          secretKey,
          responses,
          params: {
            ...crypto.encrypt(responses, publicKey),
            version: 4,
            formFields: {
              name: { question: 'Name' },
              country: { question: '[Myinfo] Birth country' },
              existing: { question: 'Replacement question' },
            },
          },
        }
      }

      it.each([
        { scenario: 'omitted', overrides: undefined },
        { scenario: 'empty', overrides: {} },
      ])(
        'fills missing questions from the webhook when caller overrides are $scenario',
        ({ overrides }) => {
          // Prepare: the wire answers omit questions, and the backend supplies the final labels.
          const { secretKey, params, responses } = createWebhook()

          // Act: an empty third argument must behave the same as the default argument.
          const decrypted = crypto.decryptToV4(secretKey, params, overrides)

          // Assert: labels are filled without changing answers or adding another MyInfo prefix.
          expect(decrypted?.responses.name).toEqual({
            ...responses.name,
            question: 'Name',
          })
          expect(decrypted?.responses.country).toEqual({
            ...responses.country,
            question: '[Myinfo] Birth country',
          })
        }
      )

      it('preserves encrypted question text when webhook metadata has a different label', () => {
        // Prepare
        const { secretKey, params } = createWebhook()

        // Act
        const decrypted = crypto.decryptToV4(secretKey, params)

        // Assert: only missing questions may be backfilled.
        expect(decrypted?.responses.existing.question).toBe(
          'Encrypted question'
        )
      })

      it('overrides one webhook label without dropping other labels or mutating the payload', () => {
        // Prepare: the caller supplies metadata for only one of the fields.
        const { secretKey, params } = createWebhook()
        const originalMetadata = JSON.parse(JSON.stringify(params.formFields))
        const overrides = { name: { question: 'Caller label' } }

        // Act
        const decrypted = crypto.decryptToV4(secretKey, params, overrides)

        // Assert: caller metadata wins per field, while other webhook labels remain available.
        expect(decrypted?.responses.name.question).toBe('Caller label')
        expect(decrypted?.responses.country.question).toBe(
          '[Myinfo] Birth country'
        )
        expect(params.formFields).toEqual(originalMetadata)
        expect(overrides).toEqual({ name: { question: 'Caller label' } })
      })

      it('keeps responses without metadata and does not create answers for metadata-only fields', () => {
        // Prepare: the metadata map and submitted answer IDs overlap only partially.
        const { secretKey, params, responses } = createWebhook()
        const partialParams = {
          ...params,
          formFields: {
            name: { question: 'Name' },
            unanswered: { question: 'Not submitted' },
          },
        }

        // Act
        const decrypted = crypto.decryptToV4(secretKey, partialParams)

        // Assert: metadata enriches answers but does not determine which answers exist.
        expect(decrypted?.responses.name.question).toBe('Name')
        expect(decrypted?.responses.country).toEqual(responses.country)
        expect(decrypted?.responses).not.toHaveProperty('unanswered')
      })

      it('decrypts older V4 payloads unchanged when question metadata is absent', () => {
        // Prepare: older senders provide only the encrypted content and wrapped key.
        const { secretKey, params, responses } = createWebhook()
        const legacyParams = {
          encryptedContent: params.encryptedContent,
          encryptedSubmissionSecretKey: params.encryptedSubmissionSecretKey,
          version: params.version,
        }

        // Act
        const decrypted = crypto.decryptToV4(secretKey, legacyParams)

        // Assert
        expect(decrypted?.responses).toEqual(responses)
      })
    })

    const FIELD_ID_1 = '000000000000000000000001'
    const FIELD_ID_2 = '000000000000000000000002'

    const formFieldsMeta = {
      [FIELD_ID_1]: { question: 'What is your name?' },
      [FIELD_ID_2]: { question: 'Contact number' },
    }

    const encryptAndDecryptToV4 = (responses: unknown) => {
      const { publicKey, secretKey } = crypto.generate()
      const ciphertext = crypto.encrypt(responses, publicKey)
      return crypto.decryptToV4(
        secretKey,
        { ...ciphertext, version: INTERNAL_TEST_VERSION },
        formFieldsMeta
      )
    }

    it('should backfill empty question text on V4 responses from formFields', () => {
      // Arrange: V4-shaped responses as stored by blobs written from wire
      // bodies (question empty, provenance present)
      const v4Responses = {
        [FIELD_ID_1]: {
          fieldType: 'textfield',
          answer: { value: 'A name' },
          question: '',
          provenance: {},
        },
        [FIELD_ID_2]: {
          fieldType: 'mobile',
          answer: { value: '+6598765432' },
          question: '',
          provenance: {},
        },
      }

      // Act
      const decrypted = encryptAndDecryptToV4(v4Responses)

      // Assert
      expect(decrypted).not.toBeNull()
      expect(decrypted!.responses[FIELD_ID_1].question).toEqual(
        'What is your name?'
      )
      expect(decrypted!.responses[FIELD_ID_2].question).toEqual(
        'Contact number'
      )
      // Answers and provenance untouched
      expect(decrypted!.responses[FIELD_ID_1].answer).toEqual({
        value: 'A name',
      })
      expect(decrypted!.responses[FIELD_ID_1].provenance).toEqual({})
    })

    it('should preserve question text already present on V4 responses', () => {
      // Arrange
      const v4Responses = {
        [FIELD_ID_1]: {
          fieldType: 'textfield',
          answer: { value: 'A name' },
          question: 'Original question',
          provenance: {},
        },
      }

      // Act
      const decrypted = encryptAndDecryptToV4(v4Responses)

      // Assert
      expect(decrypted!.responses[FIELD_ID_1].question).toEqual(
        'Original question'
      )
    })

    it('should leave question empty when the field is absent from formFields', () => {
      // Arrange: field not present in formFieldsMeta (e.g. deleted field)
      const unknownFieldId = '00000000000000000000000f'
      const v4Responses = {
        [unknownFieldId]: {
          fieldType: 'textfield',
          answer: { value: 'orphan' },
          question: '',
          provenance: {},
        },
      }

      // Act
      const decrypted = encryptAndDecryptToV4(v4Responses)

      // Assert
      expect(decrypted!.responses[unknownFieldId].question).toEqual('')
    })

    it('should adapt V3 responses to V4 with question text from formFields', () => {
      // Arrange: V3-shaped responses (no provenance)
      const v3Responses = {
        [FIELD_ID_1]: {
          fieldType: 'textfield',
          answer: 'A name',
        },
      }

      // Act
      const decrypted = encryptAndDecryptToV4(v3Responses)

      // Assert
      expect(decrypted!.responses[FIELD_ID_1]).toEqual({
        fieldType: 'textfield',
        question: 'What is your name?',
        answer: { value: 'A name' },
        // adaptV3ToV4 stamps a default provenance when none is provided
        provenance: { submittedAt: expect.any(String) },
      })
    })
  })
})
