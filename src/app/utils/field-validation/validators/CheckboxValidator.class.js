const BaseFieldValidator = require('./BaseFieldValidator.class')
const { isOneOfOptions, isOtherOption } = require('./options')
class CheckboxValidator extends BaseFieldValidator {
  _isFilledAnswerValid() {
    const { answerArray } = this.response
    const { fieldOptions, othersRadioButton, validateByValue } = this.formField

    // Ensure that min selected is valid
    const validMin = validateByValue
      ? this._minNumberSelected(answerArray)
      : true
    // Ensure that max selected is valid
    const validMax = validateByValue
      ? this._maxNumberSelected(answerArray)
      : true

    // Ensure that answers are not duplicated (what if fieldOptions has dupes?)
    // and there can only be 1 Others option
    // Ensure that each answer exists in field option, or is an other option
    let previouslySelected = new Set()
    let previouslySelectedOthers = false
    const areAnswersValid = answerArray.every((answer) => {
      // The order of checking matters:
      // Admins can create fieldOptions that look like ['Option 1', 'Others: please elaborate']
      // in which case, when a respondent submits 'Others: please elaborate',
      // that submitted value would be a valid OneOfOptions, not a valid Other option.
      const validValue =
        !previouslySelected.has(answer) && isOneOfOptions(fieldOptions, answer)
      const validOthersValue =
        !previouslySelectedOthers && isOtherOption(othersRadioButton, answer)
      if (validValue) {
        previouslySelected.add(answer)
      } else if (validOthersValue) {
        previouslySelectedOthers = true
      }
      return validValue || validOthersValue
    })
    this.logIfInvalid(areAnswersValid, `CheckboxValidator.areAnswersValid`)

    return validMin && validMax && areAnswersValid
  }
  _minNumberSelected(answerArray) {
    const { customMin } = this.formField.ValidationOptions || {}
    const isValid = this._isValueEmpty(customMin)
      ? true
      : answerArray.length >= Number(customMin)
    this.logIfInvalid(
      isValid,
      `CheckboxValidator.validMin customMin=${customMin} length=${answerArray.length}`,
    )
    return isValid
  }
  _maxNumberSelected(answerArray) {
    const { customMax } = this.formField.ValidationOptions || {}
    const isValid = this._isValueEmpty(customMax)
      ? true
      : answerArray.length <= Number(customMax)
    this.logIfInvalid(
      isValid,
      `CheckboxValidator.validMax customMax=${customMax} length=${answerArray.length}`,
    )
    return isValid
  }
}

module.exports = CheckboxValidator
