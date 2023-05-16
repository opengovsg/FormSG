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
    it('should convert local dates to UTC', () => {
      // We can only test using this function in different system times by
      // manually changing system time and rerunning this test

      const dateString = '2023-04-23T00:00:00'
      const localDate = new Date(Date.parse(dateString))
      const utcDate = new Date(Date.parse(`${dateString}+00:00`))

      const result = DateUtils.normalizeDateToUtc(localDate)

      expect(result).toStrictEqual(utcDate)
    })
  })

  describe('loadDateFromNormalizedDate', () => {
    it('should convert normalised (UTC) dates to local date', () => {
      // We can only test using this function in different system times by
      // manually changing system time and rerunning this test

      const dateString = '2023-04-23T00:00:00'
      const utcDate = new Date(Date.parse(`${dateString}+00:00`))
      const localDate = new Date(Date.parse(dateString))

      const result = DateUtils.loadDateFromNormalizedDate(utcDate)

      expect(result).toStrictEqual(localDate)
    })
  })
})
