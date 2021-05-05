const ArrayAnswerField = require('./ArrayAnswerField.class')
const MixIns = require('./MixIns')

/**
 * Field class for field.fieldType === 'checkbox'.
 */
class CheckboxField extends MixIns.RangeValidation(ArrayAnswerField) {
  constructor(fieldData) {
    super(fieldData)
    // This check ensures that if we support injected values in the future, they
    // don't get overridden. The current default is that fieldValue for checkboxes
    // is stored as an empty string in the backend.
    if (!this.fieldValue) {
      this.fieldValue = Array(this.fieldOptions.length + 1).fill(false)
    }
  }

  getResponse() {
    const response = super.getResponse()
    // Throw error if field value is missing
    if (this.isVisible && this.required && this.fieldValue.every((v) => !v)) {
      console.error(
        `Attempt to getResponse on required field with no answer:\tfieldType=${
          this.fieldType
        }, fieldId=${this._id}, typeof fieldValue=${typeof this.fieldValue}`,
      )
      throw new Error(
        `Missing answer for required field, fieldType ${this.fieldType}.`,
      )
    }
    // The backend will look for answerArray instead of answer for checkbox
    response.answerArray = this.fieldOptions.filter(
      (_, i) => this.fieldValue[i],
    )
    if (this.fieldValue[this.fieldValue.length - 1]) {
      response.answerArray.push(`Others: ${this.fieldValueOthers}`)
    }
    return response
  }

  getDefaultBasicData() {
    const fieldData = super.getDefaultBasicData()
    fieldData.fieldOptions = ['Option 1']
    return fieldData
  }

  clear(shouldClearMyInfo) {
    if (this.myInfo && this.myInfo.attr && !shouldClearMyInfo) {
      return
    }
    this.fieldValue.fill(false)
    this.fieldValueOthers = ''
  }
}

module.exports = CheckboxField
