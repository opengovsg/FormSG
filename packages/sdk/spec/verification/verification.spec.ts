import { VERIFICATION_KEYS } from '../../src/resource/verification-keys'
import Verification from '../../src/verification'
import { MissingSecretKeyError, MissingPublicKeyError } from '../../src/errors'

const TEST_PUBLIC_KEY = VERIFICATION_KEYS.test.publicKey
const TEST_SECRET_KEY = VERIFICATION_KEYS.test.secretKey

const TEST_TRANSACTION_EXPIRY = 10000
const TEST_PARAMS = {
  transactionId: 'transactionId',
  formId: 'formId',
  fieldId: 'fieldId',
  answer: 'answer',
}
const TIME = 1588658696255
const VALID_SIGNATURE = `f=formId,v=transactionId,t=${TIME},s=XLF1V4RDu8dEJLq1yK3UN92TwiekVoif7PX4V8cXr5ERfIQXlOcO+ZOFAawawKWhFSqScg5z1Ro+Y+bMeNmRAg==`
const INVALID_SIGNATURE = `f=formId,v=transactionId,t=${TIME},s=InvalidSignatureyK3UN92TwiekVoif7PX4V8cXr5ERfIQXlOcO+ZOFAawawKWhFSqScg5z1Ro+Y+bMeNmRAg==`
const DEFORMED_SIGNATURE = `abcdefg`

const VALID_AUTH_PAYLOAD = {
  signatureString: VALID_SIGNATURE,
  submissionCreatedAt: TIME + 1,
  fieldId: TEST_PARAMS.fieldId,
  answer: TEST_PARAMS.answer,
}

describe('Verification', () => {
  describe('Initialization', () => {
    it('should not generate signatures if secret key is not provided', () => {
      // Arrange
      const verification = new Verification({
        // No secret key provided.
        transactionExpiry: TEST_TRANSACTION_EXPIRY,
      })

      // Act
      expect(() => verification.generateSignature(TEST_PARAMS)).toThrow(
        MissingSecretKeyError
      )
    })

    it('should not authenticate if public key is not provided', () => {
      const verification = new Verification({
        // No public key provided.
        transactionExpiry: TEST_TRANSACTION_EXPIRY,
        secretKey: TEST_SECRET_KEY,
      })

      expect(() => verification.authenticate(VALID_AUTH_PAYLOAD)).toThrow(
        MissingPublicKeyError
      )
    })

    it('should not authenticate if transaction expiry is not provided', () => {
      const verification = new Verification({
        // No transaction expiry provided.
        publicKey: TEST_PUBLIC_KEY,
        secretKey: TEST_SECRET_KEY,
      })

      expect(() => verification.authenticate(VALID_AUTH_PAYLOAD)).toThrow(
        'Provide a transaction expiry when when initializing the FormSG SDK to use this function.'
      )
    })
  })

  describe('Usage', () => {
    const verification = new Verification({
      transactionExpiry: TEST_TRANSACTION_EXPIRY,
      secretKey: TEST_SECRET_KEY,
      publicKey: TEST_PUBLIC_KEY,
    })

    let now: jest.MockInstance<number, any>

    beforeAll(() => {
      now = jest.spyOn(Date, 'now').mockImplementation(() => {
        return TIME
      })
    })

    afterAll(() => {
      now.mockRestore()
    })

    it('should generate a signature', () => {
      expect(verification.generateSignature(TEST_PARAMS)).toBe(VALID_SIGNATURE)
    })

    it('should successfully authenticate a valid signature', () => {
      expect(verification.authenticate(VALID_AUTH_PAYLOAD)).toBe(true)
    })

    it('should fail to authenticate a valid signature if it is expired', () => {
      const payload = {
        signatureString: VALID_SIGNATURE,
        submissionCreatedAt: TIME + TEST_TRANSACTION_EXPIRY * 2000,
        fieldId: TEST_PARAMS.fieldId,
        answer: TEST_PARAMS.answer,
      }
      expect(verification.authenticate(payload)).toBe(false)
    })

    it('should fail to authenticate an invalid signature', () => {
      const payload = {
        signatureString: INVALID_SIGNATURE,
        submissionCreatedAt: TIME + 1,
        fieldId: TEST_PARAMS.fieldId,
        answer: TEST_PARAMS.answer,
      }
      expect(verification.authenticate(payload)).toBe(false)
    })

    it('should fail to authenticate a deformed signature', () => {
      const payload = {
        signatureString: DEFORMED_SIGNATURE,
        submissionCreatedAt: TIME + 1,
        fieldId: TEST_PARAMS.fieldId,
        answer: TEST_PARAMS.answer,
      }
      expect(verification.authenticate(payload)).toBe(false)
    })
  })
})
