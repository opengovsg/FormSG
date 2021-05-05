const SingleAnswerField = require('./SingleAnswerField.class')

/**
 * Field class for field.fieldType === 'dropdown'.
 */
class DropdownField extends SingleAnswerField {
  getDefaultBasicData() {
    const fieldData = super.getDefaultBasicData()
    fieldData.fieldOptionsFromText = 'Option 1'
    fieldData.fieldOptions = fieldData.fieldOptionsFromText.split('\n')
    return fieldData
  }
}

module.exports = DropdownField
