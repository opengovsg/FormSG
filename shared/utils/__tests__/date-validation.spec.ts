import { InvalidDaysOptions } from '../../types'
import {
  convertInvalidDaysOfTheWeekToNumberSet,
  isDateAnInvalidDay,
} from '../date-validation'

describe('File validation utils', () => {
  describe('convertInvalidDaysOfTheWeekToNumberSet', () => {
    it('should return empty set if there are no invalid days in invalid days array', () => {
      const mockInvalidDays: InvalidDaysOptions[] = []
      const expectedSet = new Set()
      expect(convertInvalidDaysOfTheWeekToNumberSet(mockInvalidDays)).toEqual(
        expectedSet,
      )
    })

    it('should return set containing the correct number representation of the days in the invalid days array', () => {
      const mockInvalidDays = [
        InvalidDaysOptions.Monday,
        InvalidDaysOptions.Tuesday,
        InvalidDaysOptions.Sunday,
      ]
      const expectedSet = new Set([1, 2, 7])
      expect(convertInvalidDaysOfTheWeekToNumberSet(mockInvalidDays)).toEqual(
        expectedSet,
      )
    })
  })
  describe('isDateAnInvalidDay', () => {
    it('should invalidate invalid day if there is a match in invalidDays array', () => {
      const mockDate = new Date('2022-08-02')
      const mockInvalidDays = [
        InvalidDaysOptions.Tuesday,
        InvalidDaysOptions.Wednesday,
      ]
      expect(isDateAnInvalidDay(mockDate, mockInvalidDays)).toBe(true)
    })

    it('should validate valid day if there is no invalid day in invalidDays array', () => {
      const mockDate = new Date()
      const mockInvalidDays: InvalidDaysOptions[] = []
      expect(isDateAnInvalidDay(mockDate, mockInvalidDays)).toBe(false)
    })

    it('should validate valid day if there is no match between date and invalidDays array', () => {
      const mockDate = new Date('2022-08-02')
      const mockInvalidDays = [
        InvalidDaysOptions.Friday,
        InvalidDaysOptions.Monday,
      ]
      expect(isDateAnInvalidDay(mockDate, mockInvalidDays)).toBe(false)
    })
  })
})
