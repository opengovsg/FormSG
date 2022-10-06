import { InvalidIdTokenError } from '../spcp.oidc.client.errors'
import {
  extractNricOrForeignIdFromParsedSub,
  parseSub,
  retryPromiseForever,
  retryPromiseThreeAttempts,
} from '../spcp.oidc.util'

const MOCK_PROMISE_NAME = 'promise'

// Set longer timeout for testing because
// There does not seem to be an easy way to flush promise queue each of which fulfils with a delay
// See https://github.com/facebook/jest/issues/2157
jest.setTimeout(100000)

afterEach(() => {
  jest.clearAllMocks()
})

describe('SpOidcUtil', () => {
  describe('retryPromiseThreeAttempts', () => {
    it('should retry if promise rejects immediately', async () => {
      // Arrange

      const rejectPromiseOnce = jest
        .fn()
        .mockRejectedValueOnce(new Error())
        .mockResolvedValueOnce('ok')

      // Act

      await retryPromiseThreeAttempts(rejectPromiseOnce, MOCK_PROMISE_NAME)

      // Assert
      expect(rejectPromiseOnce).toHaveBeenCalledTimes(2)
    })

    it('should retry if promise rejects with a delay', async () => {
      // Arrange

      const rejectPromiseOnceDelay = jest
        .fn()
        .mockReturnValueOnce(
          new Promise((resolve, reject) => setTimeout(() => reject(), 10)),
        )
        .mockResolvedValueOnce('ok')

      // Act

      await retryPromiseThreeAttempts(rejectPromiseOnceDelay, MOCK_PROMISE_NAME)

      // Assert
      expect(rejectPromiseOnceDelay).toHaveBeenCalledTimes(2)
    })

    it('should retry at most three times', async () => {
      // Arrange

      const rejectPromiseFourTimes = jest
        .fn()
        .mockRejectedValueOnce(new Error('1'))
        .mockRejectedValueOnce(new Error('2'))
        .mockRejectedValueOnce(new Error('3'))
        .mockRejectedValueOnce(new Error('4'))

      // Act
      const tryRetry = retryPromiseThreeAttempts(
        rejectPromiseFourTimes,
        MOCK_PROMISE_NAME,
      )

      // Assert
      await expect(tryRetry).rejects.toThrow('3')
    })
  })

  describe('retryPromiseForever', () => {
    it('should retry if promise rejects immediately', async () => {
      // Arrange

      const rejectPromiseOnce = jest
        .fn()
        .mockRejectedValueOnce(new Error())
        .mockResolvedValueOnce('ok')

      // Act

      await retryPromiseForever(rejectPromiseOnce, MOCK_PROMISE_NAME)

      // Assert
      expect(rejectPromiseOnce).toHaveBeenCalledTimes(2)
    })

    it('should retry if promise rejects with a delay', async () => {
      // Arrange

      const rejectPromiseOnceDelay = jest
        .fn()
        .mockReturnValueOnce(
          new Promise((resolve, reject) => setTimeout(() => reject(), 10)),
        )
        .mockResolvedValueOnce('ok')

      // Act

      await retryPromiseForever(rejectPromiseOnceDelay, MOCK_PROMISE_NAME)

      // Assert
      expect(rejectPromiseOnceDelay).toHaveBeenCalledTimes(2)
    })

    it('should retry more than three times', async () => {
      // Arrange

      const rejectPromiseThreeTimes = jest
        .fn()
        .mockRejectedValueOnce(new Error('1'))
        .mockRejectedValueOnce(new Error('2'))
        .mockRejectedValueOnce(new Error('3'))
        .mockResolvedValueOnce('ok')

      // Act
      const result = await retryPromiseForever(
        rejectPromiseThreeTimes,
        MOCK_PROMISE_NAME,
      )

      // Assert
      expect(result).toBe('ok')
    })
  })

  describe('parseSub', () => {
    it('should return InvalidIdTokenError if sub is improperly formatted with too few `=`', () => {
      // Arrange
      const MOCK_MALFORMED_SUB = 'key1=value1,key2=value2,key3.value3'

      // Act

      const result = parseSub(MOCK_MALFORMED_SUB)

      // Assert
      expect(result).toBeInstanceOf(InvalidIdTokenError)
    })

    it('should return InvalidIdTokenError if sub is improperly formatted with too many `=`', () => {
      // Arrange
      const MOCK_MALFORMED_SUB = 'key1=value1,key2=value2,key3==value3'

      // Act

      const result = parseSub(MOCK_MALFORMED_SUB)

      // Assert
      expect(result).toBeInstanceOf(InvalidIdTokenError)
    })

    it('should parse sub correctly', () => {
      // Arrange
      const MOCK_SUB = 'key1=value1,key2=value2,key3=value3'
      const EXPECTED_PARSED_SUB = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
        { key: 'key3', value: 'value3' },
      ]

      // Act
      const result = parseSub(MOCK_SUB)

      // Assert
      expect(result).toMatchObject(EXPECTED_PARSED_SUB)
    })
  })

  describe('extractNricOrForeignIdFromParsedSub', () => {
    it('should return the first nric value if it exists', () => {
      // Arrange

      const MOCK_CORRECT_NRIC = 'S1234567D'
      const MOCK_PARSED_SUB = [
        { key: 'key1', value: 'value1' },
        { key: 's', value: MOCK_CORRECT_NRIC },
        { key: 's', value: 'S9876543C' },
      ]

      // Act
      const result = extractNricOrForeignIdFromParsedSub(MOCK_PARSED_SUB)

      // Assert
      expect(result).toBe(MOCK_CORRECT_NRIC)
    })

    it('should return the foreign id value if it exists', () => {
      // Arrange

      const MOCK_FOREIGN_ID = 'S0001234567D'
      const MOCK_PARSED_SUB = [
        { key: 'key1', value: 'value1' },
        { key: 's', value: MOCK_FOREIGN_ID },
        { key: 's', value: 'S9876543C' },
      ]

      // Act
      const result = extractNricOrForeignIdFromParsedSub(MOCK_PARSED_SUB)

      // Assert
      expect(result).toBe(MOCK_FOREIGN_ID)
    })

    it('should return undefined if nric does not exist', () => {
      const MOCK_PARSED_SUB_WITHOUT_NRIC = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
        { key: 'key3', value: 'value3' },
      ]

      // Act
      const result = extractNricOrForeignIdFromParsedSub(
        MOCK_PARSED_SUB_WITHOUT_NRIC,
      )

      // Assert
      expect(result).toBeUndefined()
    })
  })
})
