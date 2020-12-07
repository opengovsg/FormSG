import moment from 'moment'
/**
 * @param date
 * @returns a moment with the date in the format 'DD MMM YYYY'
 */
export const createMomentFromDateString = (date: string): moment.Moment => {
  const DATE_FORMAT = 'DD MMM YYYY'

  return moment(date, DATE_FORMAT, true)
}
