const BaseFieldValidator = require('./BaseFieldValidator.class')
const {
  isHomePhoneNumber,
  startsWithSgPrefix,
} = require('../../../../shared/util/phone-num-validation')
class HomeNoValidator extends BaseFieldValidator {
  _isFilledAnswerValid() {
    const { answer } = this.response

    let isValid = isHomePhoneNumber(answer)
    this.logIfInvalid(
      isValid,
      'HomeNoValidator._isFilledAnswerValid.isValidHomeNumber',
    )

    if (!this.formField.allowIntlNumbers) {
      isValid = isValid && startsWithSgPrefix(answer)
      this.logIfInvalid(
        isValid,
        'HomeNoValidator._isFilledAnswerValid.isValidSgNumber',
      )
    }
    return isValid
  }
}

module.exports = HomeNoValidator
