import { format } from 'date-fns'
import { InvalidDaysOptions } from '../types/field/dateField'

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
