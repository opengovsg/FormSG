const moment = require('moment-timezone')

const isMalformedDate = (date) =>
  date && !moment(date, 'YYYY-MM-DD', true).isValid()

const createQueryWithDateParam = (startDate, endDate) => {
  const augmentedQuery = {}
  if (startDate && endDate) {
    augmentedQuery.created = {
      $gte: moment.tz(startDate, 'Asia/Singapore').startOf('day').toDate(),
      $lte: moment.tz(endDate, 'Asia/Singapore').endOf('day').toDate(),
    }
  }
  return augmentedQuery
}

module.exports = {
  isMalformedDate,
  createQueryWithDateParam,
}
