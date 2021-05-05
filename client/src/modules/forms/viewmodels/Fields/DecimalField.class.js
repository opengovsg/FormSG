const SingleAnswerField = require('./SingleAnswerField.class')
const MixIns = require('./MixIns')

/**
 * Field class for field.fieldType === 'decimal'.
 */
class DecimalField extends MixIns.RangeValidation(SingleAnswerField) {}

module.exports = DecimalField
