import moment from 'moment-timezone'

import {
  createQueryWithDateParam,
  getStartOfDay,
  isMalformedDate,
} from 'src/app/utils/date'

describe('Date Util', () => {
  describe('isMalformedDate', () => {
    it('should return false if no date provided', async () => {
      // Act
      const result = isMalformedDate()
      // Assert
      expect(result).toEqual(false)
    })

    it('should return false if valid date provided', async () => {
      // Act
      const result = isMalformedDate('2019-09-01')
      // Assert
      expect(result).toEqual(false)
    })

    it('should return true if impossible date provided', async () => {
      // Act
      const result = isMalformedDate('2019-22-01')
      // Assert
      expect(result).toEqual(true)
    })

    it('should return true if invalid date format provided', async () => {
      // Act
      const result = isMalformedDate('000000')
      // Assert
      expect(result).toEqual(true)
    })
  })

  describe('createQueryWithDateParam', () => {
    it('should return empty object if startDate and endDate not provided', () => {
      // Act
      const result = createQueryWithDateParam()
      // Assert
      expect(result).toEqual({})
    })

    it('should return empty object if only 1 date provided', () => {
      // Act
      const startDate = '2020-08-17'
      const result = createQueryWithDateParam(startDate)
      // Assert
      expect(result).toEqual({})
    })

    it('should return object with created field if startDate and endDate provided', () => {
      // Act
      const startDate = '2020-08-17'
      const endDate = '2020-09-18'
      const result = createQueryWithDateParam(startDate, endDate)
      // Assert
      const expected = {
        startDateStartOfDay: moment('2020-08-16T16:00:00.000Z').toDate(),
        endDateEndOfDay: moment('2020-09-18T15:59:59.999Z').toDate(),
      }
      expect(result).toEqual({
        created: {
          $gte: expected.startDateStartOfDay,
          $lte: expected.endDateEndOfDay,
        },
      })
    })
  })

  describe('getStartOfDay', () => {
    it(`should return today's start of day if date is not given`, () => {
      // Act
      const result = getStartOfDay()
      // Assert
      const today = new Date(new Date().setHours(0, 0, 0, 0))
      expect(result).toEqual(today)
    })

    it(`should return the given date's start of day if date is given`, () => {
      // Act
      const date = new Date(2023, 4, 27, 16, 4, 53)
      const result = getStartOfDay(date)
      // Assert
      const expected = new Date(date.setHours(0, 0, 0, 0))
      expect(result).toEqual(expected)
    })
  })
})
