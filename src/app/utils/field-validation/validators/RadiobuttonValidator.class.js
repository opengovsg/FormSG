const BaseFieldValidator = require('./BaseFieldValidator.class')
const { isOneOfOptions, isOtherOption } = require('./options')
class RadiobuttonValidator extends BaseFieldValidator {
  _isFilledAnswerValid() {
    const { answer } = this.response
    const { fieldOptions, othersRadioButton } = this.formField
    const isValid =
      isOneOfOptions(fieldOptions, answer) ||
      isOtherOption(othersRadioButton, answer)
    this.logIfInvalid(isValid, `RadiobuttonValidator._isFilledAnswerValid`)
    return isValid
  }
}
module.exports = RadiobuttonValidator
