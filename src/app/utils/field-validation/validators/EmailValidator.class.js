const BaseFieldValidator = require('./BaseFieldValidator.class')
const validator = require('validator')

class EmailValidator extends BaseFieldValidator {
  _isFilledAnswerValid() {
    const { answer } = this.response
    const isValid = validator.isEmail(String(answer))
    this.logIfInvalid(isValid, 'EmailValidator._isFilledAnswerValid')
    return isValid
  }
}
module.exports = EmailValidator
