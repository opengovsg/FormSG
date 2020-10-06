const BaseFieldValidator = require('./BaseFieldValidator.class')

/**
 * Evaluates whether answer is valid according to validation options.
 * @param {String} answer The submitted answer
 * @param {Object} validationOptions An object defining validation rules
 * @param {String} validationOptions.selectedValidation One of ['Exact','Minimum','Maximum']
 * @param {String} validationOptions.customMin If selectedValidation is 'Minimum', answer must
 * be at least this length. If 'Exact' is chosen, answer must match length exactly.
 * @param {String} validationOptions.customMax If selectedValidation is 'Maximum', answer must
 * be at least this length. If 'Exact' is chosen, answer must match length exactly.
 *
 * TODO: Tech debt here - we should evaluate whether we can simply check the selectedValidation
 * and choose customMin / customMax / customValue to validate against directly, instead of
 * having customMin/customMax also play the role for 'Exact'.
 */
function isNumberOfCharactersValid(answer, validationOptions) {
  if (validationOptions) {
    const { customMin, customMax, selectedValidation } = validationOptions
    switch (selectedValidation) {
      case 'Exact': {
        // We need to be sure customMax === customMin but
        // that should be validated on form field configuration, not on submission
        let exact
        if (customMin !== null) {
          exact = Number(customMin)
        } else if (customMax !== null) {
          exact = Number(customMax)
        } else {
          return true // No value was set for validating the length of the answer against
        }
        return answer.length === exact
      }
      case 'Minimum': {
        const min = customMin !== null ? Number(customMin) : null
        if (min === null) return true
        return answer.length >= min
      }
      case 'Maximum': {
        const max = customMax !== null ? Number(customMax) : null
        if (max === null) return true
        return answer.length <= max
      }
      default:
        // No validation selected
        return true
    }
  }
  return true
}

/**
 * Text validator class that is only used for table field validation
 * @deprecated
 */
class TextValidator extends BaseFieldValidator {
  /**
   * Overrides _isValueEmpty to catch for strings that are whitespace only for required fields
   * @param {String} value
   * @returns true if value is null, undefined, empty string or string with whitespaces only
   */
  _isValueEmpty(value) {
    return (
      typeof value === 'undefined' ||
      value === null ||
      (typeof value === 'string' && value.trim() === '')
    )
  }

  _isFilledAnswerValid() {
    const { answer } = this.response
    const { ValidationOptions } = this.formField
    const trimmedAnswer = String(answer).trim()
    const isValid = isNumberOfCharactersValid(trimmedAnswer, ValidationOptions)
    this.logIfInvalid(isValid, `TextValidator.isNumberOfCharactersValid`)
    return isValid
  }
}
module.exports = TextValidator
