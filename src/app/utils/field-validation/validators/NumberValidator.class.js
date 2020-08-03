const BaseFieldValidator = require('./BaseFieldValidator.class')
const _ = require('lodash')
class NumberValidator extends BaseFieldValidator {
  /**
   * Validates the length of submitted answer against selected validation option
   * @param {String} answer The answer from the client
   * @param {Object} validationOption Validation option defined on the form field
   * @param {String} validationOption.selectedValidation One of 'Exact', 'Minimum', 'Maximum'
   * @param {Number} [validationOption.customVal] Optional exact number of chars when 'Exact' is chosen
   * @param {Number} [validationOption.customMin] Optional minimum number of chars when 'Minimum' is chosen
   * @param {Number} [validationOption.customMax] Optional maximum number of chars when 'Maximum' is chosen
   * @returns {Boolean}
   */
  _validateLengthOfAnswer(answer, validationOption) {
    // Form admin selected a validation option
    // Unary operator used in case form admin did not enter a value for validation
    switch (validationOption.selectedValidation) {
      case 'Exact':
        return validationOption.customVal
          ? answer.length === validationOption.customVal
          : true
      case 'Minimum':
        return validationOption.customMin
          ? answer.length >= validationOption.customMin
          : true
      case 'Maximum':
        return validationOption.customMax
          ? answer.length <= validationOption.customMax
          : true
      default:
        return false
    }
  }
  /**
   * Validates the answer, which must be an empty string or a nonnegative integer
   * @param {String} answer The answer from the client
   * @returns {Boolean}
   */
  _validateNumberPattern(answer) {
    return /^\d*$/.test(answer)
  }
  /**
   * Validates a Number field with associated length checks
   * @returns {Boolean}
   * @memberof FieldValidator
   */
  _isFilledAnswerValid() {
    const { answer } = this.response
    const validationOption = _.get(this.formField, 'ValidationOptions')

    let isValidNumberPattern
    let isValidLength = true

    // Check for valid characters
    isValidNumberPattern = this._validateNumberPattern(answer)
    this.logIfInvalid(
      isValidNumberPattern,
      `NumberValidator._validateNumberPattern`,
    )

    // Perform additional check if a validation option was selected by form admin
    if (validationOption && validationOption.selectedValidation) {
      isValidLength = this._validateLengthOfAnswer(answer, validationOption)
      this.logIfInvalid(isValidLength, `NumberValidator._isFilledAnswerValid`)
    }

    return isValidNumberPattern && isValidLength
  }
}
module.exports = NumberValidator
