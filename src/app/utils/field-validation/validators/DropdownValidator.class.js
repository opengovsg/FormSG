const BaseFieldValidator = require('./BaseFieldValidator.class')
const { isOneOfOptions } = require('./options')
class DropdownValidator extends BaseFieldValidator {
  _isFilledAnswerValid() {
    const { fieldOptions } = this.formField
    const { answer } = this.response
    const isValid = isOneOfOptions(fieldOptions, answer)
    this.logIfInvalid(isValid, `DropdownValidator._isFilledAnswerValid`)
    return isValid
  }
}
module.exports = DropdownValidator
