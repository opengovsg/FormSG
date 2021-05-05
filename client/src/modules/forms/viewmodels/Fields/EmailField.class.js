const VerifiableField = require('./VerifiableField.class')

/**
 * Field class for field.fieldType === 'email'.
 */
class EmailField extends VerifiableField {
  getDefaultBasicData() {
    const fieldData = super.getDefaultBasicData()
    fieldData.autoReplyOptions = {
      hasAutoReply: false,
      autoReplyMessage: '',
      includeFormSummary: false,
    }
    fieldData.isVerifiable = false
    fieldData.hasAllowedEmailDomains = false
    fieldData.allowedEmailDomains = []
    return fieldData
  }
}

module.exports = EmailField
