import {
  addDays,
  endOfToday,
  format,
  isAfter,
  isBefore,
  isDate,
  parseISO,
  startOfToday,
} from 'date-fns'

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
      // eslint-disable-next-line @typescript-eslint/no-extra-semi
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

/** Transforms YYYY-MM-DD strings to date, otherwise null */
export const transformShortIsoStringToDate = (
  isoString: unknown,
): Date | null => {
  return isShortIsoDateString(isoString)
    ? // Set to UTC time regardless.
      parseISO(`${isoString}T00:00:00Z`)
    : null
}

export const transformDateToShortIsoString = (date: unknown): string | null => {
  return isDate(date) ? format(date as Date, 'yyyy-MM-dd') : null
}

const ALL_INVALID_DAYS_ARR = Object.values(InvalidDaysOptions)

/** Transforms the invalid days array to valid days checkbox group value */
export const transformInvalidDaysToCheckedBoxesValue = (
  invalidDays: InvalidDaysOptions[],
): InvalidDaysOptions[] => {
  const invalidDaysSet = new Set(invalidDays)
  return ALL_INVALID_DAYS_ARR.filter((day) => !invalidDaysSet.has(day))
}

/** Transforms the valid days checkbox group value to invalid days array */
export const transformCheckedBoxesValueToInvalidDays = (
  validDays: InvalidDaysOptions[],
): InvalidDaysOptions[] => {
  const validDaysSet = new Set(validDays)
  return ALL_INVALID_DAYS_ARR.filter((day) => !validDaysSet.has(day))
}

const DAY_TO_NUMBER_MAP: Record<InvalidDaysOptions, number> = {
  [InvalidDaysOptions.Monday]: 1,
  [InvalidDaysOptions.Tuesday]: 2,
  [InvalidDaysOptions.Wednesday]: 3,
  [InvalidDaysOptions.Thursday]: 4,
  [InvalidDaysOptions.Friday]: 5,
  [InvalidDaysOptions.Saturday]: 6,
  [InvalidDaysOptions.Sunday]: 7,
}

/**
 * Convert the days of the week in the invalidDays array
 * to a number array representing the number representation
 * of the corresponding day of the week
 */
export const convertInvalidDaysOfTheWeekToNumberSet = (
  invalidDays: InvalidDaysOptions[],
): Set<number> => {
  if (invalidDays.length === 0) {
    return new Set()
  }

  return new Set(invalidDays.map((invalidDay) => DAY_TO_NUMBER_MAP[invalidDay]))
}

export const isDateAnInvalidDay = (
  date: Date,
  invalidDays: InvalidDaysOptions[],
): boolean => {
  const invalidDaySet = convertInvalidDaysOfTheWeekToNumberSet(invalidDays)

  const dayNumberFormat = parseInt(format(date, 'i'))

  return invalidDaySet.has(dayNumberFormat)
}
