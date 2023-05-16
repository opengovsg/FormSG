import timezoneMock from 'timezone-mock'

import * as DateUtils from './date'

describe('date', () => {
  describe('isDateBeforeToday', () => {
    it('should return true when the input date is in the past', () => {
      const result = DateUtils.isDateBeforeToday(new Date('2023-04-23'))

      expect(result).toBe(true)
    })
    it('should return true when the input date is yesterday', () => {
      const now = new Date()
      const result = DateUtils.isDateBeforeToday(
        new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
      )

      expect(result).toBe(true)
    })
    it('should return false when the input date is within today (e.g. now)', () => {
      const result = DateUtils.isDateBeforeToday(new Date())

      expect(result).toBe(false)
    })
    it('should return false when the input date is today', () => {
      const now = new Date()
      const result = DateUtils.isDateBeforeToday(
        new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      )

      expect(result).toBe(false)
    })
    it('should return false when the input date is in the future', () => {
      const now = new Date()
      const result = DateUtils.isDateBeforeToday(
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
      )

      expect(result).toBe(false)
    })
  })

  describe('isDateAfterToday', () => {
    it('should return true when the input date is in the future', () => {
      const result = DateUtils.isDateAfterToday(new Date('3023-04-23'))

      expect(result).toBe(true)
    })
    it('should return true when the input date is tomorrow', () => {
      const now = new Date()
      const result = DateUtils.isDateAfterToday(
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
      )

      expect(result).toBe(true)
    })
    it('should return false when the input date is within today (e.g. now)', () => {
      const result = DateUtils.isDateAfterToday(new Date())

      expect(result).toBe(false)
    })
    it('should return false when the input date is today', () => {
      const now = new Date()
      const result = DateUtils.isDateAfterToday(
        new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      )

      expect(result).toBe(false)
    })
    it('should return false when the input date is in the past', () => {
      const now = new Date()
      const result = DateUtils.isDateAfterToday(
        new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
      )

      expect(result).toBe(false)
    })
  })

  describe('normalizeDateToUtc', () => {
    beforeEach(() => {
      timezoneMock.unregister()
    })
    it('should convert local dates to UTC', () => {
      const dateString = '2023-04-23T00:00:00'
      const localDate = new Date(Date.parse(dateString))
      const utcDate = new Date(Date.parse(`${dateString}+00:00`))

      const result = DateUtils.normalizeDateToUtc(localDate)

      expect(result).toStrictEqual(utcDate)
    })
    it('should convert negative UTC (local) dates to UTC', () => {
      const dateString = '2023-04-23T00:00:00'

      // First, create Date value for UTC
      timezoneMock.register('UTC')
      const utcDate = new Date(Date.parse(dateString))

      // Simulate 'local' timezone when users are in UTC-12
      timezoneMock.register('Etc/GMT+12')
      const negativeUtcDate = new Date(Date.parse(dateString))

      const result = DateUtils.normalizeDateToUtc(negativeUtcDate)

      expect(result).toStrictEqual(utcDate)
    })
    it('should convert positive UTC (local) dates to UTC', () => {
      const dateString = '2023-04-23T00:00:00'

      // First, create Date value for UTC
      timezoneMock.register('UTC')
      const utcDate = new Date(Date.parse(dateString))

      // Simulate 'local' timezone when users are in UTC+14
      timezoneMock.register('Etc/GMT-14')
      const positiveUtcDate = new Date(Date.parse(dateString))

      const result = DateUtils.normalizeDateToUtc(positiveUtcDate)

      expect(result).toStrictEqual(utcDate)
    })
  })

  describe('loadDateFromNormalizedDate', () => {
    it('should convert normalised (UTC) dates to local date', () => {
      const dateString = '2023-04-23T00:00:00'
      const utcDate = new Date(Date.parse(`${dateString}+00:00`))
      const localDate = new Date(Date.parse(dateString))

      const result = DateUtils.loadDateFromNormalizedDate(utcDate)

      expect(result).toStrictEqual(localDate)
    })
    it('should convert normalised (UTC) dates to negative UTC (local) date', () => {
      const dateString = '2023-04-23T00:00:00'

      // First, create Date value for UTC
      timezoneMock.register('UTC')
      const utcDate = new Date(Date.parse(dateString))

      // Simulate 'local' timezone when users are in UTC-12
      timezoneMock.register('Etc/GMT+12')
      const negativeUtcDate = new Date(Date.parse(dateString))

      const result = DateUtils.loadDateFromNormalizedDate(utcDate)

      expect(result).toStrictEqual(negativeUtcDate)
    })
    it('should convert normalised (UTC) dates to positive UTC (local) date', () => {
      const dateString = '2023-04-23T00:00:00'

      // First, create Date value for UTC
      timezoneMock.register('UTC')
      const utcDate = new Date(Date.parse(dateString))

      // Simulate 'local' timezone when users are in UTC+14
      timezoneMock.register('Etc/GMT-14')
      const positiveUtcDate = new Date(Date.parse(dateString))

      const result = DateUtils.loadDateFromNormalizedDate(utcDate)

      expect(result).toStrictEqual(positiveUtcDate)
    })
  })
})
