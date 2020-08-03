const BaseFieldValidator = require('./BaseFieldValidator.class')
const moment = require('moment-timezone')

const DATE_FORMAT = 'DD MMM YYYY'

class DateValidator extends BaseFieldValidator {
  /**
   * Validator for a date field (parsable)
   *   1. answer follows the date format
   *   2. if date validation option is set, check that the answer is valid
   * Assumes that both the server and client could be anywhere in the world, i.e. (UTC-12 to UTC+14)
   *
   * @returns {Boolean}
   * @memberof BaseFieldValidator
   */

  _isFilledAnswerValid() {
    const { answer } = this.response
    const answerDate = moment(answer, DATE_FORMAT, true)

    // 1. Checks if answer has the correct format
    if (!answerDate.isValid()) {
      this.logIfInvalid(false, `DateValidator.invalidDate`)
      return false
    }

    // 2. Checks if answer fulfills the date validation option

    const { selectedDateValidation, customMinDate, customMaxDate } =
      this.formField.dateValidation || {}

    const isFutureOnly = selectedDateValidation === 'Disallow past dates'
    const isPastOnly = selectedDateValidation === 'Disallow future dates'

    // Today takes two possible values - a min and max, to account for all possible timezones
    const todayMin = moment().utc().subtract(12, 'hours').startOf('day')
    const todayMax = moment().utc().add(14, 'hours').startOf('day')

    if (isFutureOnly && answerDate.isBefore(todayMin)) {
      return false
    }
    if (isPastOnly && answerDate.isAfter(todayMax)) {
      return false
    }

    if (customMinDate && answerDate.isBefore(customMinDate)) {
      return false
    }

    if (customMaxDate && answerDate.isAfter(customMaxDate)) {
      return false
    }

    return true
  }
}
module.exports = DateValidator
