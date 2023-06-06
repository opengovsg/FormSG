import { InvalidDaysOptions } from '../../types'
import {
  convertInvalidDaysOfTheWeekToNumberSet,
  hasAvailableDates,
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
    it('should return true if there is a match in invalidDays array', () => {
      const mockTues = new Date('2022-08-02')
      const mockWed = new Date('2022-08-03')
      const mockInvalidDays = [
        InvalidDaysOptions.Tuesday,
        InvalidDaysOptions.Wednesday,
      ]
      expect(isDateAnInvalidDay(mockTues, mockInvalidDays)).toBe(true)
      expect(isDateAnInvalidDay(mockWed, mockInvalidDays)).toBe(true)
    })

    it('should return false if there is no invalid day in invalidDays array', () => {
      const mockDate = new Date()
      const mockInvalidDays: InvalidDaysOptions[] = []
      expect(isDateAnInvalidDay(mockDate, mockInvalidDays)).toBe(false)
    })

    it('should return false if there is no match between date and invalidDays array', () => {
      const mockTues = new Date('2022-08-02')
      const mockWed = new Date('2022-08-03')
      const mockThurs = new Date('2022-08-04')
      const mockSat = new Date('2022-08-06')
      const mockSun = new Date('2022-08-07')
      const mockInvalidDays = [
        InvalidDaysOptions.Friday,
        InvalidDaysOptions.Monday,
      ]
      expect(isDateAnInvalidDay(mockTues, mockInvalidDays)).toBe(false)
      expect(isDateAnInvalidDay(mockWed, mockInvalidDays)).toBe(false)
      expect(isDateAnInvalidDay(mockThurs, mockInvalidDays)).toBe(false)
      expect(isDateAnInvalidDay(mockSat, mockInvalidDays)).toBe(false)
      expect(isDateAnInvalidDay(mockSun, mockInvalidDays)).toBe(false)
    })
  })
  describe('hasAvailableDates', () => {
    describe('when there is more than or equal to 7 invalid days', () => {
      it('should return false when all days are invalid', () => {
        const mockStartDate = new Date('2022-10-19')
        const mockEndDate = new Date('2022-10-25')
        const mockInvalidDays = [
          InvalidDaysOptions.Monday,
          InvalidDaysOptions.Tuesday,
          InvalidDaysOptions.Wednesday,
          InvalidDaysOptions.Thursday,
          InvalidDaysOptions.Friday,
          InvalidDaysOptions.Saturday,
          InvalidDaysOptions.Sunday,
        ]
        expect(
          hasAvailableDates(mockStartDate, mockEndDate, mockInvalidDays),
        ).toBe(false)
      })
      it('should return true when some days are valid', () => {
        const mockStartDate = new Date('2022-10-19')
        const mockEndDate = new Date('2022-10-25')
        const mockInvalidDays = [
          InvalidDaysOptions.Monday,
          InvalidDaysOptions.Tuesday,
          InvalidDaysOptions.Wednesday,
          InvalidDaysOptions.Thursday,
          InvalidDaysOptions.Friday,
          InvalidDaysOptions.Saturday,
          InvalidDaysOptions.Saturday, // duplicate day of the week
        ]
        expect(
          hasAvailableDates(mockStartDate, mockEndDate, mockInvalidDays),
        ).toBe(true)
      })
    })
    describe('when there is less than 7 invalid days', () => {
      describe('when the date difference is more than or equals to 6 days', () => {
        it('should return true when there are valid days', () => {
          const mockStartDate = new Date('2022-10-19')
          const mockEndDate = new Date('2022-10-25')
          const mockInvalidDays = [
            InvalidDaysOptions.Monday,
            InvalidDaysOptions.Tuesday,
            InvalidDaysOptions.Wednesday,
            InvalidDaysOptions.Thursday,
            InvalidDaysOptions.Friday,
            InvalidDaysOptions.Saturday,
          ]
          expect(
            hasAvailableDates(mockStartDate, mockEndDate, mockInvalidDays),
          ).toBe(true)
        })
      })
      describe('when the date difference is less than 6 days', () => {
        it('should return false when all dates are invalid days', () => {
          const mockStartDate = new Date('2022-10-19')
          const mockEndDate = new Date('2022-10-24')
          const mockInvalidDays = [
            InvalidDaysOptions.Monday,
            InvalidDaysOptions.Wednesday,
            InvalidDaysOptions.Thursday,
            InvalidDaysOptions.Friday,
            InvalidDaysOptions.Saturday,
            InvalidDaysOptions.Sunday,
          ]
          expect(
            hasAvailableDates(mockStartDate, mockEndDate, mockInvalidDays),
          ).toBe(false)
        })
        it('should return true when not all dates are invalid days', () => {
          const mockStartDate = new Date('2022-10-19') // Wednesday
          const mockEndDate = new Date('2022-10-24') // Monday
          const mockInvalidDays = [
            InvalidDaysOptions.Monday,
            InvalidDaysOptions.Tuesday,
            InvalidDaysOptions.Wednesday,
            InvalidDaysOptions.Thursday,
            InvalidDaysOptions.Friday,
            InvalidDaysOptions.Saturday,
          ]
          // Sunday is not an invalid day
          expect(
            hasAvailableDates(mockStartDate, mockEndDate, mockInvalidDays),
          ).toBe(true)
        })
      })
    })
  })
})
