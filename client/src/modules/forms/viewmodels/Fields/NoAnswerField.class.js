const Field = require('./Field.class')

/**
 * Superclass for all fields which users cannot answer, and are
 * therefore not included in form responses.
 */
// TODO: Currently empty, will be used to add methods
// for image/statement fields in future.
class NoAnswerField extends Field {
  // Implement clear so it can be called on this field, but it
  // does not need to do anything.
  clear() {}
}

module.exports = NoAnswerField
