const VerifiableField = require('./VerifiableField.class')

/**
 * Field class for field.fieldType === 'mobile'
 */
class MobileField extends VerifiableField {
  getDefaultBasicData() {
    const fieldData = super.getDefaultBasicData()
    fieldData.allowIntlNumbers = false
    fieldData.isVerifiable = false
    return fieldData
  }
}

module.exports = MobileField
