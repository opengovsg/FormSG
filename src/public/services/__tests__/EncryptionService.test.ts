import * as EncryptionService from '../EncryptionService'
import { FormSgSdk } from '../FormSgSdkService'

jest.mock('../FormSgSdkService')
const MockFormSgSdk = jest.mocked(FormSgSdk)

describe('EncryptionService', () => {
  describe('encryptSubmissionResponses', () => {
    const MOCK_PUBLIC_KEY = 'mockpublickey'
    const MOCK_ENCRYPTED_RESPONSES = 'this is a success!'

    const VALID_EMAIL_RESPONSE = {
      _id: 'some-id',
      question: 'some-question',
      answer: 'some-answer',
      fieldType: 'email',
    }

    const VALID_TABLE_RESPONSE = {
      _id: 'some-table-id',
      question: 'some-table-question',
      answerArray: [
        ['r1c1-answer', 'r1c2-answer'],
        ['r2c1-answer', 'r2c2-answer'],
      ],
      fieldType: 'table',
    }

    beforeEach(() => {
      MockFormSgSdk.crypto.encrypt.mockReturnValue(MOCK_ENCRYPTED_RESPONSES)
    })

    it('should throw error when given responses is not an array', () => {
      // Arrange
      const mockResponses = 'not an array'

      // Act
      const fn = () =>
        EncryptionService.encryptSubmissionResponses(
          mockResponses,
          MOCK_PUBLIC_KEY,
        )

      // Assert
      expect(fn).toThrow('Input submission is malformed')
      expect(MockFormSgSdk.crypto.encrypt).not.toHaveBeenCalled()
    })

    it('should throw error when responses contains invalid shapes', async () => {
      const invalidResponse = {
        _id: 'some-id-2',
        question: 'some-question, no answer and no fieldType',
      }
      const mockResponses = [VALID_EMAIL_RESPONSE, invalidResponse]

      // Act
      const fn = () =>
        EncryptionService.encryptSubmissionResponses(
          mockResponses,
          MOCK_PUBLIC_KEY,
        )

      // Assert
      expect(fn).toThrow('Input shape not a response')
      expect(MockFormSgSdk.crypto.encrypt).not.toHaveBeenCalled()
    })

    it('should return original responses when given input responses passes validation', () => {
      // Arrange
      const mockResponses = [VALID_EMAIL_RESPONSE, VALID_TABLE_RESPONSE]

      // Act
      const actual = EncryptionService.encryptSubmissionResponses(
        mockResponses,
        MOCK_PUBLIC_KEY,
      )

      // Assert
      expect(actual).toEqual(MOCK_ENCRYPTED_RESPONSES)
      expect(MockFormSgSdk.crypto.encrypt).toHaveBeenCalledTimes(1)
      expect(MockFormSgSdk.crypto.encrypt).toHaveBeenCalledWith(
        mockResponses,
        MOCK_PUBLIC_KEY,
      )
    })
  })
})
