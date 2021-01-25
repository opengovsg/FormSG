const formsg = require('@opengovsg/formsg-sdk')()

const FieldFactory = require('../helpers/field-factory')
const {
  getEncryptedAttachmentsMap,
  getAttachmentsMap,
  fieldHasAttachment,
} = require('../helpers/attachments-map')
const { NoAnswerField } = require('./Fields')

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
   * Gets the submitted values of all fields.
   * @returns {Array} Array of response objects.
   */
  getResponses() {
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
   * Creates a map of field ID to attachment file.
   * The values of the map are encrypted for Storage Mode
   * forms.
   * @returns {Object} Map of { id: file }
   */
  getAttachments() {
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
   * Gets the encrypted responses
   */
  getEncryptedContent() {
    if (this.responseMode === 'encrypt') {
      return formsg.crypto.encrypt(this.getResponses(), this.publicKey)
    }
    return null
  }
}

module.exports = Form
