const Field = require('./Field.class')

/**
 * Superclass for all fields which users are able to answer.
 */
class AnswerField extends Field {
  /**
   * Returns a response, but without an answer. Subclasses should
   * add an answer attribute depending on the format of the answer.
   */
  getResponse() {
    const response = {
      _id: this._id,
      fieldType: this.fieldType,
      question: this.title,
    }
    if (this.myInfo) {
      response.myInfo = this.myInfo
    }
    return response
  }
}

module.exports = AnswerField
