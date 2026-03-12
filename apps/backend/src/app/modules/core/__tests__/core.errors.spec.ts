import { ErrorCodes } from '../core.errors'

describe('core', () => {
  describe('error codes', () => {
    it('should be 6 digits long', () => {
      // iterate through the enum values and verify that they are 6 digits
      // not the value but the length of the number representation
      const errorCodeValues = Object.values(ErrorCodes).filter(
        (value) => typeof value === 'number',
      ) as number[]

      errorCodeValues.forEach((errorCode) => {
        expect(String(errorCode).length).toBe(6)
      })
    })

    it('should follow SCREAMING_SNAKE_CASE', () => {
      const isScreamingSnakeCase = /^[A-Z0-9]+(_[A-Z0-9]+)*$/

      // TS enums put both the key and the value in the enum object
      const keys = Object.keys(ErrorCodes).filter((v) => isNaN(Number(v)))

      keys.forEach((key) => {
        expect(key).toMatch(isScreamingSnakeCase)
      })
    })
  })
})
