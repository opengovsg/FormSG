import range from 'lodash/range'

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export const getYearOptions = (): number[] =>
  range(1, new Date().getFullYear() + 51)

export const getMonthOffsetFromToday = (
  month: number,
  year: number,
): number => {
  // const currYear = new Date().getFullYear()
  // const currMonth = new Date().getMonth()
  return 2
}
