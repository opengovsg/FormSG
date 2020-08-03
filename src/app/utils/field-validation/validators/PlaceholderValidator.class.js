const BaseFieldValidator = require('./BaseFieldValidator.class')
class PlaceholderValidator extends BaseFieldValidator {
  /**
   * Given a response, the answer is valid as long as there is a value
   * @returns {Boolean}
   * @memberof FieldValidator
   */
  _isFilledAnswerValid() {
    const { answer } = this.response
    const isValid = !this._isValueEmpty(answer)
    this.logIfInvalid(isValid, `PlaceholderValidator._isFilledAnswerValid`)
    return isValid
  }
}

module.exports = PlaceholderValidator
