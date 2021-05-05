const SingleAnswerField = require('./SingleAnswerField.class')

/**
 * Field class for field.fieldType === 'attachment'.
 */
class AttachmentField extends SingleAnswerField {
  clear(shouldClearMyInfo) {
    super.clear(shouldClearMyInfo)
    delete this.file
  }
}

module.exports = AttachmentField
