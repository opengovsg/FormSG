/**
 * Parses a question from a form field for downstream emails etc.
 * @param {Object} formField
 */
function getQuestionFromField(formField) {
  switch (formField.fieldType) {
    case 'table':
      return getQuestionFromTableField(formField)
    default:
      return getQuestionFromRegularField(formField)
  }
}

/**
 * Parses a question from a non-table field
 * @param {Object} formField
 */
function getQuestionFromRegularField(formField) {
  return formField.title
}

/**
 * Parses a question from a table field
 * @param {Object} formField
 */
function getQuestionFromTableField(formField) {
  let columnTitles = formField.columns.map((col) => col.title)
  return `${formField.title} (${columnTitles.join(', ')})`
}

module.exports = getQuestionFromField
