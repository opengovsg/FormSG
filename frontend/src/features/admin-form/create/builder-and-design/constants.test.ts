import { BASIC_FIELDS_ORDERED_CATEGORIES } from './constants'

describe('BASIC_FIELDS_ORDERED_CATEGORIES', () => {
  it('should not have duplicated values', () => {
    const uniqueValues = new Set(BASIC_FIELDS_ORDERED_CATEGORIES)
    expect(uniqueValues.size).toBe(BASIC_FIELDS_ORDERED_CATEGORIES.length)
  })
})
