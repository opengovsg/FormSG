import moment from 'moment-timezone'

export const isMalformedDate = (date?: Date): Boolean =>
  date && !moment(date, 'YYYY-MM-DD', true).isValid()

export const createQueryWithDateParam = (
  startDate?: Date,
  endDate?: Date,
): Object => {
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
