const logger = require('../../../../config/logger').createLoggerWithLabel(
  module,
)

/**
 * Interface which all field validators must implement
 *
 * @class FieldValidatorInterface
 */
class FieldValidatorInterface {
  constructor() {
    if (new.target === FieldValidatorInterface) {
      throw new Error('Abstract FieldValidatorInterface cannot be instantiated')
    }
  }

  isAnswerValid() {
    throw new Error('isAnswerValid is not implemented')
  }

  _isFilledAnswerValid() {
    throw new Error('_isFilledAnswerValid is not implemented')
  }

  _isAnswerRequired() {
    throw new Error('_isAnswerRequired is not implemented')
  }

  _isValueEmpty(_value) {
    throw new Error('_isValueEmpty is not implemented')
  }

  /**
   * Logs a message if the field is invalid
   *
   * @param {Boolean} isValid returns true if valid
   * @param {String} message
   */
  logIfInvalid(isValid, message) {
    if (!isValid) {
      const logMeta = {
        action: 'logIfInvalid',
        formId: this.formId,
        fieldId: this.formField._id,
      }
      if (this.formField.fieldType) {
        logMeta.fieldType = this.formField.fieldType
      } else if (this.formField.columnType) {
        logMeta.columnType = this.formField.columnType
      }
      logger.error({
        message: `Invalid field: ${message}`,
        meta: logMeta,
      })
    }
  }

  /**
   * Logs a message if the `answerArray` property does not exist in table or checkboxes,
   * so that when this message no longer appears in logs, we can start to roll out the table and checkbox validators
   * which will be based on answerArray, instead of answer
   *
   * @memberof FieldValidatorInterface
   */
  logIfAnswerArrayDoesNotExist() {
    if (
      this.formField.fieldType === 'table' ||
      this.formField.fieldType === 'checkbox'
    ) {
      if (!Object.prototype.hasOwnProperty.call(this.response, 'answerArray')) {
        logger.info({
          message: 'answerArray does not exist',
          meta: {
            action: 'logIfAnswerArrayDoesNotExist',
            formId: this.formId,
            fieldId: this.formField._id,
            fieldType: this.formField.fieldType,
          },
        })
      }
    }
  }
}

module.exports = FieldValidatorInterface
