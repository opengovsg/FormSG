const { TableValidator, BaseFieldValidator } = require('./validators')

const myInfoTypes = require('../../../shared/resources/myinfo').types
/**
 *
 *  Factory for creating validators based on the field type found in the response
 *
 * @class FieldValidatorFactory
 * @deprecated
 */
class FieldValidatorFactory {
  /**
   * Creates a field validator for the appropriate form field type
   * @param {String} formId id of form for logging
   * @param {Object} formField Any form field retrieved from the database
   * @param {BaseFieldValidator} validator An instance of BaseFieldValidator class
   */
  createFieldValidator(formId, formField, response) {
    const { fieldType, myInfo } = response
    if (myInfo) {
      this._injectMyInfo(formField)
    }

    // 'statement' and 'image' are rejected prior to the creation of a field validator
    switch (fieldType) {
      case 'section':
      case 'textfield': // short text
      case 'textarea': // long text
      case 'nric':
      case 'yes_no':
      case 'homeno':
      case 'checkbox':
      case 'rating':
      case 'mobileno':
      case 'date':
      case 'decimal':
      case 'radiobutton':
      case 'attachment':
      case 'email':
      case 'number':
      case 'dropdown':
        throw new Error(`${fieldType} has been migrated to TypeScript`)
      case 'table':
        return new TableValidator(...arguments)
      default:
        // Checks if answer is optional or required, but will throw an error when there is an answer
        // since _isFilledAnswerValid is not implemented
        return new BaseFieldValidator(...arguments)
    }
  }

  /**
   * Helper function to inject MyInfo data. This is necessary because the
   * client strips out MyInfo data to keep each form submission lightweight
   * @param {*} formField Any form field retrieved from the database
   */
  _injectMyInfo(formField) {
    const [myInfoField] = myInfoTypes.filter(
      (x) => x.name === formField.myInfo.attr,
    )
    if (!myInfoField)
      throw new Error(
        `Could not find myInfoField for attr: ${formField.myInfo.attr}`,
      )
    const { fieldType, fieldOptions, ValidationOptions } = myInfoField
    if (fieldType) formField.fieldType = fieldType
    if (fieldOptions) formField.fieldOptions = fieldOptions
    if (ValidationOptions) formField.ValidationOptions = ValidationOptions
  }
}

module.exports = new FieldValidatorFactory()
