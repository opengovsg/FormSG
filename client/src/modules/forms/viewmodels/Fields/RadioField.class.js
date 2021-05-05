const SingleAnswerField = require('./SingleAnswerField.class')

/**
 * Field class for field.fieldType === 'radiobutton'.
 */
class RadioField extends SingleAnswerField {
  getResponse() {
    const response = super.getResponse()
    if (this.fieldValue === 'radioButtonOthers') {
      response.answer = `Others: ${this.fieldValueOthers}`
    }
    return response
  }

  getDefaultBasicData() {
    const fieldData = super.getDefaultBasicData()
    fieldData.fieldOptions = ['Option 1']
    return fieldData
  }

  clear(shouldClearMyInfo) {
    super.clear(shouldClearMyInfo)
    this.fieldValueOthers = ''
  }
}

module.exports = RadioField
