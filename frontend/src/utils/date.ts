import { endOfToday, isAfter, isBefore, parseISO, startOfToday } from 'date-fns'

import { InvalidDaysOptions } from '~shared/types'

import { JsonDate } from '~typings/core'

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

export const normalizeDateToUtc = (date: Date | null) => {
  if (!date) return null
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
}

export const loadDateFromNormalizedDate = (date: string | Date | null) => {
  if (!date) return null
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  return new Date(
    parsedDate.getUTCFullYear(),
    parsedDate.getUTCMonth(),
    parsedDate.getUTCDate(),
  )
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
  if (start && end) {
    return isBefore(date, start) || isAfter(date, end)
  }
  if (start) {
    return isBefore(date, start)
  }
  if (end) {
    return isAfter(date, end)
  }

  return false
}

export const ISO_DATE_FORMAT_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-](\d+(:\d+)?))?$/

export const isIsoDateString = (value: unknown): value is JsonDate => {
  return (
    typeof value === 'string' &&
    ISO_DATE_FORMAT_REGEX.test(value) &&
    !isNaN(new Date(value).getTime())
  )
}

export const SHORT_ISO_DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/

export const isShortIsoDateString = (value: unknown): value is JsonDate => {
  return (
    typeof value === 'string' &&
    SHORT_ISO_DATE_FORMAT_REGEX.test(value) &&
    !isNaN(new Date(value).getTime())
  )
}

/**
 * This function mutates given @param body, and transforms all ISO date strings
 * in the body object to Date objects.
 * @param body object to transform
 */
export const mutableTransformAllIsoStringsToDate = (body: unknown) => {
  if (body === null || body === undefined || typeof body !== 'object') {
    return
  }

  for (const key of Object.keys(body)) {
    const value = (body as Record<string, unknown>)[key]
    if (isIsoDateString(value)) {
      ;(body as Record<string, unknown>)[key] = parseISO(value)
    } else if (typeof value === 'object') {
      mutableTransformAllIsoStringsToDate(value)
    }
  }
}

/**
 * Helper method that calls `mutableTransformAllIsoStringsToDate` internally to
 * return the mutated @param body.
 * @param body object to transform
 * @returns mutated object with all ISO date strings transformed to Date objects.
 */
export const transformAllIsoStringsToDate = <T>(body: T): T => {
  mutableTransformAllIsoStringsToDate(body)
  return body
}

export const getRemainingDaysOfTheWeek = (
  days: InvalidDaysOptions[],
): InvalidDaysOptions[] => {
  const daysSet = new Set(days)
  return Object.values(InvalidDaysOptions).filter((day) => !daysSet.has(day))
}
