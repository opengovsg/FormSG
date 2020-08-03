const { isInt } = require('validator')

const BaseFieldValidator = require('./BaseFieldValidator.class')

class RatingValidator extends BaseFieldValidator {
  /**
   * Validates a Rating field. If present, the answer must be
   * between 1 and the maximum steps allowed.
   * @returns {Boolean}
   * @memberof BaseFieldValidator
   */
  _isFilledAnswerValid() {
    const { answer } = this.response
    const { steps } = this.formField.ratingOptions

    const isValid = isInt(answer, {
      min: 1,
      max: steps,
      allow_leading_zeroes: false,
    })

    this.logIfInvalid(isValid, `RatingValidator._isFilledAnswerValid`)
    return isValid
  }
}

module.exports = RatingValidator
