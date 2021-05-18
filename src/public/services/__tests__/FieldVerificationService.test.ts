import mockAxios from 'jest-mock-axios'

import { VerifiableFieldType } from 'src/types'

import {
  createTransactionForForm,
  FetchNewTransactionResponse,
  FORM_API_PREFIX,
  JsonDate,
  resetVerifiedField,
  TRANSACTION_ENDPOINT,
  triggerSendOtp,
  VERIFICATION_ENDPOINT,
  verifyOtp,
} from '../FieldVerificationService'

jest.mock('axios', () => mockAxios)

describe('FieldVerificationService', () => {
  afterEach(() => mockAxios.reset())

  describe('createTransactionForForm', () => {
    it('should successfully return transaction data when available', async () => {
      // Arrange
      const expected: FetchNewTransactionResponse = {
        expireAt: new Date().toJSON() as JsonDate,
        transactionId: 'some transaction id',
      }
      const mockFormId = 'mockFormId'

      // Act
      const actualPromise = createTransactionForForm(mockFormId)
      mockAxios.mockResponse({ data: expected })
      const actual = await actualPromise

      // Assert
      expect(actual).toEqual(expected)
      expect(mockAxios.post).toHaveBeenCalledWith(
        `${FORM_API_PREFIX}/${mockFormId}/${VERIFICATION_ENDPOINT}`,
      )
    })

    it('should successfully return empty transaction data when returned data is empty', async () => {
      // Arrange
      const expected: FetchNewTransactionResponse = {}
      const mockFormId = 'mockFormId2'

      // Act
      const actualPromise = createTransactionForForm(mockFormId)
      mockAxios.mockResponse({ data: expected })
      const actual = await actualPromise

      // Assert
      expect(actual).toEqual(expected)
      expect(mockAxios.post).toHaveBeenCalledWith(
        `${FORM_API_PREFIX}/${mockFormId}/${VERIFICATION_ENDPOINT}`,
      )
    })
  })

  describe('triggerSendOtp', () => {
    it('should call endpoint successfully', async () => {
      // Arrange
      const mockTransactionId = 'mockTransactionId'
      const mockFieldId = 'someFieldId'
      const mockAnswer = 'blablabla'
      const mockFormId = 'someFormId'

      // Act
      const actualPromise = triggerSendOtp({
        formId: mockFormId,
        transactionId: mockTransactionId,
        answer: mockAnswer,
        fieldId: mockFieldId,
        fieldType: VerifiableFieldType.Email,
      })
      mockAxios.mockResponse({ status: 201, data: 'Created' })
      await actualPromise

      // Assert
      expect(mockAxios.post).toHaveBeenCalledWith(
        `${FORM_API_PREFIX}/${mockFormId}/${VERIFICATION_ENDPOINT}/${mockTransactionId}/fields/${mockFieldId}/otp/generate`,
        {
          fieldType: VerifiableFieldType.Email,
          answer: mockAnswer,
        },
      )
    })
  })

  describe('verifyOtp', () => {
    it('should return verified signature on success', async () => {
      // Arrange
      const mockTransactionId = 'someOtherTxnId'
      const mockFieldId = 'anotherFieldId'
      const mockOtp = '123456'

      const expectedSignature = 'abcdefg'

      // Act
      const actualPromise = verifyOtp({
        fieldId: mockFieldId,
        otp: mockOtp,
        transactionId: mockTransactionId,
      })
      mockAxios.mockResponse({ data: expectedSignature })
      const actual = await actualPromise

      // Assert
      expect(actual).toEqual(expectedSignature)
      expect(mockAxios.post).toHaveBeenCalledWith(
        `${TRANSACTION_ENDPOINT}/${mockTransactionId}/otp/verify`,
        {
          fieldId: mockFieldId,
          otp: mockOtp,
        },
      )
    })
  })

  describe('resetVerifiedField', () => {
    it('should call reset endpoint with correct params', async () => {
      // Arrange
      const mockTransactionId = 'mockTransactionIdYetAgain'
      const mockFieldId = 'someFieldIdYetAgain'
      const mockFormId = 'someFormId'

      // Act
      const actualPromise = resetVerifiedField({
        formId: mockFormId,
        transactionId: mockTransactionId,
        fieldId: mockFieldId,
      })
      mockAxios.mockResponse({ status: 200, data: 'OK' })
      await actualPromise

      // Assert
      expect(mockAxios.post).toHaveBeenCalledWith(
        `${FORM_API_PREFIX}/${mockFormId}/${VERIFICATION_ENDPOINT}/${mockTransactionId}/fields/${mockFieldId}/reset`,
      )
    })
  })
})
