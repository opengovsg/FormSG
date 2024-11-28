import { checkIsOptionsMismatched } from '../options-recipients-map-validation'

describe('checkIsOptionsMismatched', () => {
  it('should return true if options have intersection but mismatched', () => {
    expect(checkIsOptionsMismatched(['a', 'b'], ['b', 'c'])).toBe(true)
  })
  it('should return true if options in csv are missing from selected field', () => {
    expect(checkIsOptionsMismatched(['a', 'b'], ['b'])).toBe(true)
  })
  it('should return true if options in selected field are missing from csv', () => {
    expect(checkIsOptionsMismatched(['a', 'b'], ['a', 'b', 'c'])).toBe(true)
  })
  it('should return false if options are exactly the same', () => {
    expect(checkIsOptionsMismatched(['a', 'b'], ['a', 'b'])).toBe(false)
  })
})
