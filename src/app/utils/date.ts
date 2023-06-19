import moment from 'moment-timezone'

export const isMalformedDate = (date?: string): boolean => {
  return Boolean(date) && !moment(date, 'YYYY-MM-DD', true).isValid()
}

/**
 * Returns a mongoose query with date range to filter results by. If either
 * startDate or endDate param is missing, an empty object is returned.
 *
 * @param startDate the start date range in YYYY-MM-DD format
 * @param endDate the end date range in YYYY-MM-DD format
 * @param createdKey the key to filter range by. Defaults to "created".
 */
export const createQueryWithDateParam = (
  startDate?: string,
  endDate?: string,
  createdKey = 'created',
):
  | { [createdKey: string]: { $gte: Date; $lte: Date } }
  | Record<string, never> => {
  if (startDate && endDate) {
    return {
      [createdKey]: {
        $gte: moment.tz(startDate, 'Asia/Singapore').startOf('day').toDate(),
        $lte: moment.tz(endDate, 'Asia/Singapore').endOf('day').toDate(),
      },
    }
  }

  // Start and end date is missing, return empty object.
  return {}
}

/**
 * Returns start of day. If date is not given, the start of day will be
 * calculated based on today's date.
 *
 * @param date the date used to calculate the starting day. Defaults to today's
 * date.
 */
export const getStartOfDay = (date?: Date): Date => {
  if (!date) {
    date = new Date()
  }
  return moment.tz(date, 'Asia/Singapore').startOf('day').toDate()
}
