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

  getSelectedSlotId() {
    if (!this.fieldOptionToSlotId || !this.fieldValue) {
      return undefined
    }
    return this.fieldOptionToSlotId.get(this.fieldValue)
  }
}

module.exports = BookingField
