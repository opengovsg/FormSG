const SingleAnswerField = require('./SingleAnswerField.class')

/**
 * Field class for all fields which can be verified.
 */
class VerifiableField extends SingleAnswerField {
  /**
   * Adds the field's signature to the default response.
   */
  getResponse() {
    const response = super.getResponse()
    if (this.signature) {
      response.signature = this.signature
    }
    return response
  }
}

module.exports = VerifiableField
