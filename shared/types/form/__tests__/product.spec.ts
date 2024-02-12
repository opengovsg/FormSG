// Unit tests for product.ts, isPaymentsProductt

import { ObjectId } from 'bson'
import { isPaymentsProducts } from '../product'
import { Product } from '../product'

describe('Product validation', () => {
  it('should return false if products is not an array', () => {
    // Arrange
    const mockProductNonArray = 'some thing'

    // Assert
    expect(isPaymentsProducts(mockProductNonArray)).toBe(false)
  })

  it('should return true if products is an empty array', () => {
    // Arrange
    const mockProductEmptyArray: Product[] = []

    // Assert
    expect(isPaymentsProducts(mockProductEmptyArray)).toBe(false)
  })

  it('should return false if product has invalid object id', () => {
    // Arrange
    const mockProductInvalidId: any = [
      {
        name: 'some name',
        description: 'some description',
        multi_qty: true,
        min_qty: 1,
        max_qty: 1,
        amount_cents: 1,
        _id: 'some id',
      },
    ]

    // Assert
    expect(isPaymentsProducts(mockProductInvalidId)).toBe(false)
  })

  it('should return false if product has no name', () => {
    // Arrange
    const mockProductWrongName = [
      {
        description: 'some description',
        multi_qty: true,
        min_qty: 1,
        max_qty: 1,
        amount_cents: 1,
        _id: new ObjectId(),
      },
    ] as unknown as Product[]

    // Assert
    expect(isPaymentsProducts(mockProductWrongName)).toBe(false)
  })

  it('should return false if there are multiple products and at least one has no name', () => {
    // Arrange
    const mockMultipleProductOneNoName = [
      {
        description: 'some description',
        multi_qty: true,
        min_qty: 1,
        max_qty: 1,
        amount_cents: 1,
        _id: new ObjectId(),
      },
      {
        name: 'has name',
        multi_qty: true,
        min_qty: 1,
        max_qty: 1,
        amount_cents: 1,
        _id: new ObjectId(),
      },
    ] as unknown as Product[]

    // Assert
    expect(isPaymentsProducts(mockMultipleProductOneNoName)).toBe(false)
  })

  it('should return true if product has valid object id and name', () => {
    // Arrange
    const mockProductsCorrectShape = [
      {
        name: 'some name',
        description: 'some description',
        multi_qty: true,
        min_qty: 1,
        max_qty: 1,
        amount_cents: 1,
        _id: new ObjectId(),
      },
    ] as unknown as Product[]

    // Assert
    expect(isPaymentsProducts(mockProductsCorrectShape)).toBe(true)
  })

  it('should return true if multiple products have valid object id and name', () => {
    // Arrange
    const mockProductsCorrectShapeMultiple = [
      {
        name: 'some name',
        description: 'some description',
        multi_qty: true,
        min_qty: 1,
        max_qty: 1,
        amount_cents: 1,
        _id: new ObjectId(),
      },
      {
        name: 'another name',
        description: 'another description',
        multi_qty: true,
        min_qty: 1,
        max_qty: 1,
        amount_cents: 1,
        _id: new ObjectId(),
      },
    ] as unknown as Product[]

    // Assert
    expect(isPaymentsProducts(mockProductsCorrectShapeMultiple)).toBe(true)
  })
})
