const FieldValidatorFactory = require('./FieldValidatorFactory.class')
const { FIELDS_TO_REJECT, ALLOWED_VALIDATORS } = require('./config')

const fieldValidatorFactory = new FieldValidatorFactory()

/**
 * Single function that abstracts away the complexity of field validation
 * and factory methods away from the controller
 * @param {String} formId id of form, for logging
 * @param {Object} formField A form field from the database
 * @param {Object} response A client-side response that is to be untrusted
 * @throws {Error}
 */
function validateField(formId, formField, response) {
  if (FIELDS_TO_REJECT.includes(response.fieldType)) {
    throw new Error(`Rejected field type "${response.fieldType}"`)
  }
  const fieldValidator = fieldValidatorFactory.createFieldValidator(
    formId,
    formField,
    response,
  )

  if (!fieldValidator.isFieldTypeValid()) {
    throw new Error('Invalid field type submitted')
  }

  if (!fieldValidator.isAnswerValid()) {
    // TODO: Remove after soft launch of validation. Should throw Error for all validators
    // fieldValidator.constructor.name only returns the name of the class if code is not minified!
    if (ALLOWED_VALIDATORS.includes(fieldValidator.constructor.name)) {
      throw new Error('Invalid answer submitted')
    }
  }
}

module.exports = validateField
