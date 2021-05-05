const SingleAnswerField = require('./SingleAnswerField.class')
const MixIns = require('./MixIns')

/**
 * Field class for field.fieldType === 'textarea'.
 */
class TextAreaField extends MixIns.CustomValidation(SingleAnswerField) {}

module.exports = TextAreaField
