const BaseFieldValidator = require('./BaseFieldValidator.class')
class YesNoValidator extends BaseFieldValidator {
  _isFilledAnswerValid() {
    const { answer } = this.response
    const isValid = ['Yes', 'No'].includes(answer)
    this.logIfInvalid(isValid, 'YesNoValidator._isFilledAnswerValid')
    return isValid
  }
}
module.exports = YesNoValidator
