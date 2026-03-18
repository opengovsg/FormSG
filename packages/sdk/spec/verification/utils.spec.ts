import {
  formatToBaseString,
  isSignatureTimeValid,
} from '../../src/verification/utils'

describe('Verification Utils', () => {
  const TEST_TRANSACTION_EXPIRY = 10000
  const TIME = 1588658696255
  const PARAMS = {
    transactionId: 'transactionId',
    formId: 'formId',
    fieldId: 'fieldId',
    answer: 'answer',
  }

  describe('formatToBaseString', () => {
    it('should construct a basestring', () => {
      // Act
      const baseString = formatToBaseString({
        time: TIME,
        ...PARAMS,
      })

      // Assert
      const expectedBaseString = `${PARAMS.transactionId}.${PARAMS.formId}.${PARAMS.fieldId}.${PARAMS.answer}.${TIME}`
      expect(baseString).toBe(expectedBaseString)
    })
  })

  describe('isSignatureTimeValid', () => {
    it('should return true if time is valid', () => {
      // Valid time less than the TEST_TRANSACTION EXPIRY
      const validTime = TIME + 1
      expect(
        isSignatureTimeValid(TIME, validTime, TEST_TRANSACTION_EXPIRY)
      ).toBe(true)
    })

    it('should return false if time is invalid (expired)', () => {
      const expiredTime = TIME + TEST_TRANSACTION_EXPIRY * 2000
      expect(
        isSignatureTimeValid(TIME, expiredTime, TEST_TRANSACTION_EXPIRY)
      ).toBe(false)
    })
  })
})
