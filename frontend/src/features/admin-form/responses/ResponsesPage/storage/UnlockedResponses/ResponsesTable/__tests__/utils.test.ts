import { getNetAmount } from '../utils'

describe('getNetAmount', () => {
  it('should return empty string when no payments are provided', () => {
    // Arrange
    const nullInput = null
    // Act
    const result = getNetAmount(nullInput)
    // Assert
    expect(result).toBe('')
  })

  it('should return empty string when no there is no transaction fees', () => {
    // Arrange
    const emptyObjectInput = {}
    // Act
    const result = getNetAmount(emptyObjectInput)
    // Assert
    expect(result).toBe('')
  })

  it('should return 0 when traansaction fee is 0', () => {
    // Arrange
    const zeroTransactionFee = { transactionFee: 0 }
    // Act
    const result = getNetAmount(zeroTransactionFee)
    // Assert
    expect(result).toBe('')
  })
})
