import {
  AdminFormDto,
  FormResponseMode,
  SubmissionMetadata,
} from 'formsg-shared/types'
import { centsToDollars } from 'formsg-shared/utils/payments'

import { getIsPaymentsForm, getNetAmount } from '../utils'

describe('getIsPaymentsForm', () => {
  it('should return false when form is undefined', () => {
    // Act
    const result = getIsPaymentsForm(undefined)
    // Assert
    expect(result).toBe(false)
  })

  it('should return false for a non-payments-capable form', () => {
    // Arrange
    const form = {
      responseMode: FormResponseMode.Email,
    } as AdminFormDto
    // Act
    const result = getIsPaymentsForm(form)
    // Assert
    expect(result).toBe(false)
  })

  it('should return payments_field.enabled for an Encrypt form', () => {
    // Arrange
    const form = {
      responseMode: FormResponseMode.Encrypt,
      payments_field: { enabled: true },
    } as AdminFormDto
    // Act
    const result = getIsPaymentsForm(form)
    // Assert
    expect(result).toBe(true)
  })

  it('should return payments_field.enabled for a Multirespondent form', () => {
    // Arrange
    const form = {
      responseMode: FormResponseMode.Multirespondent,
      payments_field: { enabled: true },
    } as AdminFormDto
    // Act
    const result = getIsPaymentsForm(form)
    // Assert
    expect(result).toBe(true)
  })

  it('should return false when a Multirespondent form has payments disabled', () => {
    // Arrange
    const form = {
      responseMode: FormResponseMode.Multirespondent,
      payments_field: { enabled: false },
    } as AdminFormDto
    // Act
    const result = getIsPaymentsForm(form)
    // Assert
    expect(result).toBe(false)
  })
})

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
    const emptyObjectInput = {} as SubmissionMetadata['payments']
    // Act
    const result = getNetAmount(emptyObjectInput)
    // Assert
    expect(result).toBe('')
  })

  it('should return 0 when traansaction fee is < 0', () => {
    // Arrange
    const zeroTransactionFee = {
      transactionFee: -1,
    } as SubmissionMetadata['payments']
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
    } as SubmissionMetadata['payments']
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
    } as SubmissionMetadata['payments']
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
    } as SubmissionMetadata['payments']
    // Act
    const result = getNetAmount(zeroTransactionFee)
    // Assert
    expect(result).toContain(centsToDollars(EXPECTED_PAYMENT_AMOUNT))
  })
})
