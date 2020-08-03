const SingleAnswerField = require('./SingleAnswerField.class')

/**
 * Field class for field.fieldType === 'rating'.
 */
class RatingField extends SingleAnswerField {
  getDefaultBasicData() {
    const fieldData = super.getDefaultBasicData()
    fieldData.ratingOptions = {
      steps: 5,
      shape: 'Heart',
    }
    return fieldData
  }
}

module.exports = RatingField
