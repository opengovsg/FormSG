import moment from 'moment-timezone'

export const isMalformedDate = (date?: string): boolean => {
  return Boolean(date) && !moment(date, 'YYYY-MM-DD', true).isValid()
}

export const createQueryWithDateParam = (
  startDate?: string,
  endDate?: string,
): { created?: { $gte: Date; $lte: Date } } => {
  if (startDate && endDate) {
    return {
      created: {
        $gte: moment.tz(startDate, 'Asia/Singapore').startOf('day').toDate(),
        $lte: moment.tz(endDate, 'Asia/Singapore').endOf('day').toDate(),
      },
    }
  } else {
    return {}
  }
}

/**
 * Function to format given date to a relative string representation.
 * @param date the date to format to its relative string representation
 * @returns the relative string representation of the given date
 */
export const formatToRelativeString = (date: Date): string => {
  const timeDiffDays = moment().diff(date, 'days')

  if (timeDiffDays <= 1) {
    return 'less than 1 day ago'
  } else if (timeDiffDays < 30) {
    return `${timeDiffDays} days ago`
  } else {
    return moment(date).format('D MMM, YYYY')
  }
}
