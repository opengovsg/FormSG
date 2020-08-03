const BaseFieldValidator = require('./BaseFieldValidator.class')
const {
  isMobilePhoneNumber,
  startsWithSgPrefix,
} = require('../../../../shared/util/phone-num-validation')
class MobileValidator extends BaseFieldValidator {
  _isFilledAnswerValid() {
    const { answer } = this.response

    let isValid = isMobilePhoneNumber(answer)

    this.logIfInvalid(
      isValid,
      'MobileValidator._isFilledAnswerValid.isValidMobileNumber',
    )

    if (!this.formField.allowIntlNumbers) {
      isValid = isValid && startsWithSgPrefix(answer)
      this.logIfInvalid(
        isValid,
        'MobileValidator._isFilledAnswerValid.isValidSgNumber',
      )
    }
    return isValid
  }
}

module.exports = MobileValidator
