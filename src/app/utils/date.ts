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
 * Returns start of day. If date is not given, the start
 * of day will be calculated based on current date.
 *
 * @param option to contain optional date and timezone used to calculate the
 * starting day. Defaults to today's date and Singapore timezone
 */
export const getStartOfDay = (option?: {
  date?: Date
  timezone?: string
}): Date => {
  if (!option) {
    option = {}
  }
  if (!option.date) {
    option.date = new Date()
  }
  if (!option.timezone) {
    option.timezone = 'Asia/Singapore'
  }

  return moment.tz(option.date, option.timezone).startOf('day').toDate()
}
