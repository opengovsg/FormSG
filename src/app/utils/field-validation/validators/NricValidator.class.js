const BaseFieldValidator = require('./BaseFieldValidator.class')
const { isNricValid } = require('../../../../shared/util/nric-validation')
class NricValidator extends BaseFieldValidator {
  _isFilledAnswerValid() {
    const { answer } = this.response
    const isValid = isNricValid(answer)
    this.logIfInvalid(isValid, `NricValidator`)
    return isValid
  }
}
module.exports = NricValidator
