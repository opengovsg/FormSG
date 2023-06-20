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
    // Default the mock time to bangkok time
    const MOCK_TIME = '2023-06-22T23:30:00-07:00'
    beforeAll(() => {
      // Mock the return value for new Date() to avoid flaky test
      jest.useFakeTimers()
      jest.setSystemTime(new Date(MOCK_TIME))
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    it(`should return today's start of day in Singapore timezone if option is not given`, () => {
      // Act
      const result = getStartOfDay()
      // Assert
      const expected = new Date('2023-06-23T00:00:00+08:00')
      expect(result).toEqual(expected)
    })

    it(`should return today's start of day in Singapore timezone if date and timezone is not given`, () => {
      // Act
      const result = getStartOfDay({})
      // Assert
      const expected = new Date('2023-06-23T00:00:00+08:00')
      expect(result).toEqual(expected)
    })

    it(`should return start of day in Singapore timezone if timezone is not given`, () => {
      // Act
      const date = new Date('2020-04-13T05:00:00.000+20:00')
      const result = getStartOfDay({ date: date })
      // Assert
      const expected = new Date(date.setUTCHours(-8, 0, 0, 0))
      expect(result).toEqual(expected)
    })

    it(`should return today's start of day based on given timezone if date is not given`, () => {
      // Act
      const result = getStartOfDay({ timezone: 'Pacific/Apia' })
      // Assert
      const expected = new Date('2023-06-23T00:00:00+13:00')
      expect(result).toEqual(expected)
    })

    it(`should return a localise start of day given date and timezone=Asia/Bangkok`, () => {
      // Act
      const date = new Date('2020-04-13T05:00:00.000+08:00')
      const result = getStartOfDay({ date: date, timezone: 'Asia/Bangkok' })
      // Assert
      const expected = new Date('2020-04-13T00:00:00.000+07:00')
      expect(result).toEqual(expected)
    })

    it(`should return a localise start of day given date and timezone=Australia/Eucla`, () => {
      // Act
      const date = new Date('2020-04-13T05:00:00.000+08:00')
      const result = getStartOfDay({ date: date, timezone: 'Australia/Eucla' })
      // Assert
      const expected = new Date('2020-04-13T00:00:00.000+08:45')
      expect(result).toEqual(expected)
    })
  })
})
