import { StorageModeSubmissionMetadata } from '~shared/types'
import { centsToDollars } from '~shared/utils/payments'

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
    const emptyObjectInput = {} as StorageModeSubmissionMetadata['payments']
    // Act
    const result = getNetAmount(emptyObjectInput)
    // Assert
    expect(result).toBe('')
  })

  it('should return 0 when traansaction fee is < 0', () => {
    // Arrange
    const zeroTransactionFee = {
      transactionFee: -1,
    } as StorageModeSubmissionMetadata['payments']
    // Act
    const result = getNetAmount(zeroTransactionFee)
    // Assert
    expect(result).toBe('')
  })

  it('should display as estimates when payment is not final', () => {
    // Arrange
    const zeroTransactionFee = {
      transactionFee: 0,
      paymentAmt: 100,
      payoutDate: null,
    } as StorageModeSubmissionMetadata['payments']
    // Act
    const result = getNetAmount(zeroTransactionFee)
    // Assert
    expect(result).toContain('Est')
  })

  it('should not display as estimate when payout is provided', () => {
    // Arrange
    const zeroTransactionFee = {
      transactionFee: 0,
      paymentAmt: 100,
      payoutDate: Date(),
    } as StorageModeSubmissionMetadata['payments']
    // Act
    const result = getNetAmount(zeroTransactionFee)
    // Assert
    expect(result).not.toContain('Est')
  })

  it('should return gross amount if transaction fee is 0', () => {
    // Arrange
    const EXPECTED_PAYMENT_AMOUNT = 123
    const zeroTransactionFee = {
      transactionFee: 0,
      paymentAmt: EXPECTED_PAYMENT_AMOUNT,
      payoutDate: Date(),
    } as StorageModeSubmissionMetadata['payments']
    // Act
    const result = getNetAmount(zeroTransactionFee)
    // Assert
    expect(result).toContain(centsToDollars(EXPECTED_PAYMENT_AMOUNT))
  })
})
