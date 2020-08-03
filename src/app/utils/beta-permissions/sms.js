const get = require('lodash/get')
const allowSms = (user, field) => {
  if (get(field, 'isVerifiable')) {
    return get(user, 'betaFlags.allowSms', false)
  }
  return true // no validation needed
}

module.exports = allowSms
