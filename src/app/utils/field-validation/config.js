const FIELDS_TO_REJECT = require('../../../shared/resources/basic')
  .types.filter((f) => !f.submitted)
  .map((f) => f.name)

module.exports = {
  FIELDS_TO_REJECT,
}
