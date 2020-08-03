const SingleAnswerField = require('./SingleAnswerField.class')

/**
 * Field class for field.fieldType === 'section'.
 */
class HeaderField extends SingleAnswerField {
  getResponse() {
    const response = super.getResponse()
    response.answer = ''
    response.isHeader = true
    return response
  }
}

module.exports = HeaderField
