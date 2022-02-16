import { addDays, endOfToday, isAfter, isBefore, startOfToday } from 'date-fns'

/**
 * Checks whether the current date is before today
 * @param date The date to check
 * @returns True if the date is before today, false otherwise
 * @note this is not equivalent to `!isDateAfterToday(date)`, and will fail if the date is indeed today.
 * @example
 * ```ts
 * // today is 2020-01-01
 * isDateAfterToday('2020-01-01') // false
 * isDateBeforeToday('2020-01-01') // also false
 *
 * isDateAfterToday('2020-01-01') === !isDateBeforeToday('2020-01-01') // false
 * ```
 */
export const isDateBeforeToday = (date: number | Date) => {
  return isBefore(date, startOfToday())
}

/**
 * Checks whether the current date is after today
 * @param date The date to check
 * @returns True if the date is after today, false otherwise
 * @note this is not equivalent to `!isDateBeforeToday(date)`, and will fail if the date is indeed today.
 * @example
 * ```ts
 * // today is 2020-01-01
 * isDateAfterToday('2020-01-01') // false
 * isDateBeforeToday('2020-01-01') // also false
 *
 * isDateAfterToday('2020-01-01') === !isDateBeforeToday('2020-01-01') // false
 * ```
 */
export const isDateAfterToday = (date: number | Date) => {
  return isAfter(date, endOfToday())
}

/**
 * Checks whether given date is out of (start, end] range, inclusive start only.
 * If no start or end is given, it will be treated an unbounded range in that direction.
 * @param date Date to check
 * @param start Start of range
 * @param end End of range
 * @returns Whether date is out of range
 */
export const isDateOutOfRange = (
  date: number | Date,
  start?: number | Date | null,
  end?: number | Date | null,
) => {
  const inclusiveStart = start ? addDays(start, -1) : null
  if (inclusiveStart && end) {
    return isBefore(date, inclusiveStart) || isAfter(date, end)
  }
  if (inclusiveStart) {
    return isBefore(date, inclusiveStart)
  }
  if (end) {
    return isAfter(date, end)
  }

  return false
}
