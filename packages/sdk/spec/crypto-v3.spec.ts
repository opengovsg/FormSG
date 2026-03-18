import mockAxios from 'jest-mock-axios'
import {
  plaintext,
  ciphertext,
  formPublicKey,
  formSecretKey,
  submissionSecretKey,
  plainVerifiedText
} from './resources/crypto-v3-data-20231207'
import CryptoV3 from '../src/crypto-v3'
import Crypto from '../src/crypto'
import { SIGNING_KEYS } from '../src/resource/signing-keys'

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
    const verifiedText = cryptoV1.encrypt(plainVerifiedText, ciphertext.submissionPublicKey, signingSecretKey)  
    const decrypted = crypto.decrypt(secretKey, {
      ...ciphertext,
      verifiedContent: verifiedText,
      version: INTERNAL_TEST_VERSION,
    })
    // Assert
    expect(decrypted).toHaveProperty('responses', plaintext)
    expect(decrypted).toHaveProperty('verified', plainVerifiedText)  
      
  })
})
