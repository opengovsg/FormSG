const FIELDS_TO_REJECT = require('../../../shared/resources/basic')
  .types.filter((f) => !f.submitted)
  .map((f) => f.name)

// deprecated
const ALLOWED_VALIDATORS = []

module.exports = {
  FIELDS_TO_REJECT,
  ALLOWED_VALIDATORS,
}
