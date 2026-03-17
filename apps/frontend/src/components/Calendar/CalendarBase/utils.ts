import {
  addDays,
  differenceInCalendarMonths,
  startOfDay,
  subDays,
} from 'date-fns'
import range from 'lodash/range'

/**
 * Full names of calendar months
 */
export const MONTH_NAMES: { shortName: string; fullName: string }[] = [
  { fullName: 'January', shortName: 'Jan' },
  { fullName: 'February', shortName: 'Feb' },
  { fullName: 'March', shortName: 'Mar' },
  { fullName: 'April', shortName: 'Apr' },
  { fullName: 'May', shortName: 'May' },
  { fullName: 'June', shortName: 'Jun' },
  { fullName: 'July', shortName: 'Jul' },
  { fullName: 'August', shortName: 'Aug' },
  { fullName: 'September', shortName: 'Sep' },
  { fullName: 'October', shortName: 'Oct' },
  { fullName: 'November', shortName: 'Nov' },
  { fullName: 'December', shortName: 'Dec' },
]

/**
 * Names of days to display at top of calendar columns
 */
export const DAY_NAMES: { shortName: string; fullName: string }[] = [
  { shortName: 'Su', fullName: 'Sunday' },
  { shortName: 'Mo', fullName: 'Monday' },
  { shortName: 'Tu', fullName: 'Tuesday' },
  { shortName: 'We', fullName: 'Wednesday' },
  { shortName: 'Th', fullName: 'Thursday' },
  { shortName: 'Fr', fullName: 'Friday' },
  { shortName: 'Sa', fullName: 'Saturday' },
]

/**
 * Generates array of years which are options in the year dropdown.
 * @returns array of years
 */
export const getYearOptions = (): number[] => range(1500, 2500)

/**
 * Finds the number of months by which a target date is offset from today.
 * @param today Current date
 * @param month Month of target from which to find offset
 * @param year Year of target from which to find offset
 * @returns Number of months target is offset from today
 */
export const getMonthOffsetFromToday = (
  today: Date,
  month: number,
  year: number,
): number => {
  return differenceInCalendarMonths(new Date(year, month), today)
}

/**
 * Calculates what date should be newly focused based on the previously
 * focused date and which key a user has pressed.
 * @param originalDate Date which was originally focused
 * @param key Key pressed
 * @returns New date which should be focused
 */
export const getNewDateFromKeyPress = (
  originalDate: Date,
  key: string,
): Date => {
  switch (key) {
    case 'ArrowUp':
      return startOfDay(subDays(originalDate, DAY_NAMES.length))
    case 'ArrowDown':
      return startOfDay(addDays(originalDate, DAY_NAMES.length))
    case 'ArrowLeft':
      return startOfDay(subDays(originalDate, 1))
    case 'ArrowRight':
      return startOfDay(addDays(originalDate, 1))
    default:
      return startOfDay(originalDate)
  }
}

/**
 * Based on a custom className given to a date element, finds the
 * date corresponding to that element.
 * The pattern used is id_dateTime, where dateTime corresponds to
 * Date.getTime().
 * @param className Class name of element
 * @param id ID to find
 * @returns Date corresponding to element
 */
export const getDateFromClassName = (
  className: string,
  id: string,
): Date | null => {
  const timestamp = new RegExp(`${id}_([0-9]+)`).exec(className)
  if (!timestamp) return null
  return new Date(parseInt(timestamp[1]))
}

/**
 * Creates a unique className for a date element, from which the corresponding
 * date can be derived.
 * @param id class name id to include in className
 * @param date Date of element
 * @returns A unique className from which the corresponding date can be derived
 */
export const generateClassNameForDate = (id: string, date: Date): string => {
  return `${id}_${startOfDay(date).getTime()}`
}
