const moment = require('moment-timezone')

const isMalformedDate = (date) =>
  date && !moment(date, 'YYYY-MM-DD', true).isValid()

const createQueryWithDateParam = (query, req) => {
  const augmentedQuery = { ...query }
  if (req.query.startDate && req.query.endDate) {
    augmentedQuery.created = {
      $gte: moment
        .tz(req.query.startDate, 'Asia/Singapore')
        .startOf('day')
        .toDate(),
      $lte: moment
        .tz(req.query.endDate, 'Asia/Singapore')
        .endOf('day')
        .toDate(),
    }
  }
  return augmentedQuery
}

module.exports = {
  isMalformedDate,
  createQueryWithDateParam,
}
