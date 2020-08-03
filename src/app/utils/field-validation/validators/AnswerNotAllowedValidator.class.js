const BaseFieldValidator = require('./BaseFieldValidator.class')

/**
 * If submitted field type does not allow answers (ie. section, statement, image),
 * ensure that any accompanying answer is empty
 * @class AnswerNotAllowedValidator
 * @extends {BaseFieldValidator}
 */
class AnswerNotAllowedValidator extends BaseFieldValidator {
  isAnswerValid() {
    const { answer } = this.response
    const noAnswer = this._isValueEmpty(answer)
    this.logIfInvalid(noAnswer, `Answer not allowed`)
    return noAnswer
  }
}

module.exports = AnswerNotAllowedValidator
