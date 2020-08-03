const BaseFieldValidator = require('./BaseFieldValidator.class')
const _ = require('lodash')
const { isFloat, isInt } = require('validator')
class DecimalValidator extends BaseFieldValidator {
  /**
   * Validates answer to be a float and within range
   * @param {String} answer
   * @param {Object} validationOption
   * @param {Integer} [validationOption.customMax]
   * @param {Integer} [validationOption.customMin]
   */
  _validateFloatAndWithinRange(answer, validationOption) {
    const { customMin, customMax } = validationOption || {}

    let isFloatOptions = {}
    if (customMin || customMin === 0) {
      isFloatOptions['min'] = customMin
    }
    if (customMax || customMax === 0) {
      isFloatOptions['max'] = customMax
    }

    // isFloat validates range correctly for floats up to 15 decimal places
    // (1.999999999999999 >= 2) is False
    // (1.9999999999999999 >= 2) is True
    return isFloat(answer, isFloatOptions)
  }

  /**
   * Validates a Decimal field with associated range check and pattern check
   * @returns {Boolean}
   * @memberof DecimalValidator
   */
  _isFilledAnswerValid() {
    const { answer } = this.response
    const validationOption = _.get(this.formField, 'ValidationOptions')

    const isFloatAndWithinRange = this._validateFloatAndWithinRange(
      answer,
      validationOption,
    )
    this.logIfInvalid(
      isFloatAndWithinRange,
      `DecimalValidator.notFloatOrNotWithinRange`,
    )

    // leading number cannot be empty (".1") and no leading zeroes ("001")
    const isLeadingPatternValid = isInt(answer.split('.')[0], {
      allow_leading_zeroes: false,
    })
    this.logIfInvalid(
      isLeadingPatternValid,
      `DecimalValidator.invalidLeadingPattern`,
    )

    return isFloatAndWithinRange && isLeadingPatternValid
  }
}
module.exports = DecimalValidator
