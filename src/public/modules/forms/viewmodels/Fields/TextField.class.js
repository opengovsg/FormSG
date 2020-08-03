const SingleAnswerField = require('./SingleAnswerField.class')
const MixIns = require('./MixIns')

/**
 * Field class for field.fieldType === 'textfield'.
 */
class TextField extends MixIns.CustomValidation(SingleAnswerField) {}

module.exports = TextField
