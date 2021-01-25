const _ = require('lodash')
const formsg = require('@opengovsg/formsg-sdk')()

const FieldFactory = require('../helpers/field-factory')
const {
  getEncryptedAttachmentsMap,
  getAttachmentsMap,
  fieldHasAttachment,
} = require('../helpers/attachments-map')
const { NoAnswerField } = require('./Fields')

// The current encrypt version to assign to the encrypted submission.
// This is needed if we ever break backwards compatibility with
// end-to-end encryption
const ENCRYPT_VERSION = 1

/**
 * Deserialises raw form object returned by backend and
 * manages form-wide operations.
 */
class Form {
  /**
   * Called to deserialise raw FormData object returned by backend.
   * @param {Object} form Form object as returned by FormApi.getPublic
   * or FormApi.getAdmin.
   */
  constructor(form) {
    Object.assign(this, form)
    this.form_fields = this.form_fields.map((fieldData) =>
      FieldFactory.createFieldFromData(fieldData),
    )
  }

  /**
   * Prevents all fields from being edited.
   */
  lockFields() {
    this.form_fields.forEach((field) => field.lock())
  }

  /**
   * Internal helper function to get the submitted values of all fields
   * that are supposed to have answers.
   * @returns {Array} Array of response objects.
   */
  _getResponses() {
    return this.form_fields
      .filter((field) => !(field instanceof NoAnswerField))
      .map((field) => {
        if (!field.isVisible) {
          field.clear(true)
        }
        return field.getResponse()
      })
  }

  /**
   * Internal helper function that creates a map of field ID to attachment file.
   * The values of the map are encrypted for Storage Mode.
   * forms.
   * @returns {Object} Map of { id: file }
   */
  _getAttachments() {
    const attachmentsMap = getAttachmentsMap(this.form_fields)
    if (this.responseMode === 'encrypt') {
      return getEncryptedAttachmentsMap(attachmentsMap, this.publicKey)
    } else {
      return Promise.resolve(attachmentsMap)
    }
  }

  /**
   * Determines if any field has an attachment uploaded.
   * @returns {Boolean} True if any field has an attachment uploaded
   */
  hasAttachments() {
    return this.form_fields.some(fieldHasAttachment)
  }

  /**
   * Gets the encrypted values of the responses. Only applicable to
   * Storage Mode forms.
   */
  _getEncryptedContent() {
    if (this.responseMode === 'encrypt') {
      return formsg.crypto.encrypt(this._getResponses(), this.publicKey)
    }
    return null
  }

  /**
   * Method to abstract away edge cases for submission responses in email vs encrypt mode
   */
  _getResponsesForSubmission() {
    if (this.responseMode === 'encrypt') {
      // Edge case: We still send mobile and email fields to the server in plaintext
      // even with end-to-end encryption in order to support SMS and email autoreplies
      return this._getResponses()
        .filter((item) => ['mobile', 'email'].includes(item.fieldType))
        .map((item) => {
          return _(item)
            .pick(['fieldType', '_id', 'answer', 'signature'])
            .omitBy(_.isNull)
            .value()
        })
    } else return this._getResponses()
  }

  /**
   * Method to determine what to POST to the backend submission endpoint.
   * Does not include captcha verification.
   */
  async getSubmissionContent() {
    const submissionContent = {
      attachments: await this._getAttachments(),
      isPreview: this.isPreview,
      responses: this._getResponsesForSubmission(),
    }
    if (this.responseMode === 'encrypt') {
      submissionContent.encryptedContent = this._getEncryptedContent()
      submissionContent.version = ENCRYPT_VERSION
    }
    return submissionContent
  }
}

module.exports = Form
