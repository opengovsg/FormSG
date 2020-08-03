const SingleAnswerField = require('./SingleAnswerField.class')
const moment = require('moment-timezone')

/**
 * Field class for field.fieldType === 'date'.
 */
class DateField extends SingleAnswerField {
  constructor(fieldData) {
    super(fieldData)
    // Parse to Date object in the SG timezone if MyInfo injects a value
    if (this.fieldValue) {
      this.fieldValue = moment
        .tz(this.fieldValue, 'YYYY-MM-DD', true, 'Asia/Singapore')
        .toDate()
      // This is only set for dates that represent Asia/Singapore timezones e.g. date of birth.
      // We do not set this for other date fields so that the intended value is shown to the form admin.
      this.modelOptions = { timezone: 'GMT+8' }
    }
  }
  getResponse() {
    const response = super.getResponse()
    if (this.fieldValue && this.myInfo && this.myInfo.attr) {
      // MyInfo fields imply Asia/Singapore timezone
      response.answer = moment(this.fieldValue)
        .tz('Asia/Singapore')
        .format('DD MMM YYYY')
    } else if (this.fieldValue) {
      // Do not do a timezone conversion for non-MyInfo fields
      // so that the correct date is submitted to the form admin
      response.answer = moment(this.fieldValue).format('DD MMM YYYY')
    } else {
      response.answer = ''
    }
    return response
  }
}

module.exports = DateField
