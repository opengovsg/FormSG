const SingleAnswerField = require('./SingleAnswerField.class')
const MixIns = require('./MixIns')

/**
 * Field class for field.fieldType === 'number'.
 */
class NumberField extends MixIns.CustomValidation(SingleAnswerField) {}

module.exports = NumberField
