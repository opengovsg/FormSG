const FieldValidatorInterface = require('./FieldValidatorInterface.class')
const formsgSdk = require('../../../../config/formsg-sdk')

/**
 * Basic validator that checks whether required fields have answers
 * If answers are supplied, they must be validated with an implementation of _isFilledAnswerValid
 *
 * @class BaseFieldValidator
 * @extends {FieldValidatorInterface}
 */
class BaseFieldValidator extends FieldValidatorInterface {
  constructor(formId, formField, response) {
    super()
    this.formId = formId
    this.formField = formField
    this.response = response
  }

  /**
   * Public function that validates the answer
   * If an optional question has no answer, it is valid
   * If a required question has no answer, it is invalid
   * If an optional question or a required question has an answer, we need to validate that answer using _isFilledAnswerValid
   * @returns {Boolean}
   * @memberof FieldValidator
   */
  isAnswerValid() {
    this.logIfAnswerArrayDoesNotExist()
    const { answer, answerArray } = this.response
    const noAnswer = this._isValueEmpty(answerArray || answer)
    const isRequired = this._isAnswerRequired()

    if (noAnswer && isRequired) {
      // Required, but no answer
      this.logIfInvalid(false, 'Required but no answer')
      return false
    } else if (noAnswer && !isRequired) {
      // Not required, and no answer
      return true
    } else {
      // There is an answer
      return this._isFilledAnswerValid() && this._isSignatureValid()
    }
  }

  /**
   *  Checks whether an answer is required depending on its isVisible property
   *  We trust the isVisible property from the response as it has been derived server-side
   * @returns {Boolean} true if required
   * @memberof BaseFieldValidator
   */
  _isAnswerRequired() {
    const { required } = this.formField
    const { isVisible } = this.response

    const isRequired = required && isVisible

    return isRequired
  }

  /**
   * Checks if a value is null, undefined, an empty string, or an empty array
   * The number 0 is not an empty value.
   *
   * @param {Any} value
   * @returns true if value is null, undefined, an empty string, or an empty array
   * @memberof BaseFieldValidator
   */
  _isValueEmpty(value) {
    return (
      typeof value === 'undefined' ||
      value === null ||
      (typeof value === 'string' && value === '') ||
      (value instanceof Array && value.length === 0)
    )
  }

  /**
   *  Verifies the signature for a field that is verifiable
   * @returns {Boolean}
   * @memberof FieldValidator
   */
  _isSignatureValid() {
    const { isVerifiable, _id } = this.formField
    if (!isVerifiable) {
      return true // no validation occurred
    }
    const { signature, answer } = this.response

    if (!signature) {
      this.logIfInvalid(false, 'No signature')
      return false
    }

    const isSigned = formsgSdk.verification.authenticate({
      signatureString: signature,
      submissionCreatedAt: Date.now(),
      fieldId: _id,
      answer: answer,
    })
    if (!isSigned) {
      this.logIfInvalid(false, 'Invalid signature')
    }
    return isSigned
  }
}

module.exports = BaseFieldValidator
