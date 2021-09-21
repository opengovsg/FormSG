import { differenceInMonths } from 'date-fns'
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

export const normaliseMonth = (month: number): number => {
  const numMonths = MONTH_NAMES.length
  if (month < 0) {
    return (month % numMonths) + numMonths
  } else if (month >= numMonths) {
    return month % numMonths
  } else {
    return month
  }
}

export const getMonthOffsetFromToday = (
  month: number,
  year: number,
): number => {
  const res = differenceInMonths(
    convertToLocalTz(new Date(year, month)),
    convertToLocalTz(new Date()),
  )
  console.log('in getMonthOffsetFromToday')
  console.log('month', month, 'year', year, 'res', res)
  return res + 1
}

export const convertToLocalTz = (d: Date): Date => {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
}
