const SingleAnswerField = require('./SingleAnswerField.class')

/**
 * Field class for field.fieldType === 'dropdown'.
 */
class BookingField extends SingleAnswerField {
  getDefaultBasicData() {
    const fieldData = super.getDefaultBasicData()
    fieldData.eventCode = ''
    return fieldData
  }
}

module.exports = BookingField
