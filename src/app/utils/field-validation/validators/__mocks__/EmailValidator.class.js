const BaseFieldValidator = require('../BaseFieldValidator.class')
const validator = require('validator')

class EmailValidator extends BaseFieldValidator {
  _isFilledAnswerValid() {
    const { answer } = this.response
    const {
      isVerifiable,
      hasAllowedEmailDomains,
      allowedEmailDomains,
    } = this.formField
    const emailAddress = String(answer)
    let isValid = validator.isEmail(emailAddress)
    if (
      isValid &&
      isVerifiable &&
      hasAllowedEmailDomains &&
      allowedEmailDomains.length
    ) {
      const emailDomain = '@' + emailAddress.split('@').pop()
      isValid = isValid && new Set(allowedEmailDomains).has(emailDomain)
    }
    this.logIfInvalid(isValid, 'EmailValidator._isFilledAnswerValid')
    return isValid
  }

  _isSignatureValid() {
    return true
  }
}

module.exports = EmailValidator
