const BaseFieldValidator = require('./BaseFieldValidator.class')
const DropdownValidator = require('./DropdownValidator.class')
const TextValidator = require('./TextValidator.class')
const _ = require('lodash')

const validate = (formId, formField, answer, isVisible) => {
  let validator
  const response = {
    answer,
    isVisible,
  }
  switch (formField.columnType) {
    case 'dropdown':
      validator = new DropdownValidator(formId, formField, response)
      break
    case 'textfield':
      validator = new TextValidator(formId, formField, response)
      break
    default:
      validator = new BaseFieldValidator(formId, formField, response)
  }
  return validator.isAnswerValid()
}
class TableValidator extends BaseFieldValidator {
  _isAnswerRequired() {
    const { columns } = this.formField
    const { isVisible } = this.response
    const isAnyColumnRequired = columns.some((column) => column.required)
    // A table only requires an answer if any of its columns require answers
    const isRequired = isAnyColumnRequired && isVisible
    return isRequired
  }

  _isFilledAnswerValid() {
    const { answerArray, isVisible } = this.response
    const { minimumRows, addMoreRows, maximumRows, columns } = this.formField
    // Minimum number of rows
    const validMin = answerArray.length >= minimumRows
    this.logIfInvalid(
      validMin,
      `TableValidator.validMin expected length=${answerArray.length} >= minimumRows=${minimumRows}`,
    )
    if (!validMin) return validMin

    // If addMoreRows is not set, then we can't have more rows than minimumRows.
    let validMax = false
    if (!addMoreRows) {
      validMax = answerArray.length === minimumRows
      this.logIfInvalid(
        validMax,
        `TableValidator.validMax addMoreRows is not set, expected length=${answerArray.length} === minimumRows=${minimumRows}`,
      )
    } else {
      // If addMoreRows is set and maximumRows is null, then we can have unlimited rows.
      // If addMoreRows is set and maximumRows is a number, then we can't have more rows than maximumRows.
      validMax = maximumRows === null || answerArray.length <= maximumRows
      this.logIfInvalid(
        validMax,
        `TableValidator.validMax addMoreRows is set, expected length=${answerArray.length} <= maximumRows=${maximumRows}`,
      )
    }
    if (!validMax) return validMax

    // Are the number of answers submitted correct for every row?
    const areNumColumnsValid = answerArray.every(
      (row) => row.length === columns.length,
    )
    this.logIfInvalid(areNumColumnsValid, `TableValidator.areNumColumnsValid`)
    if (!areNumColumnsValid) return areNumColumnsValid

    // Now, each column may be a text field, or a dropdown field
    // For all the text fields, use the text field validator (no min char)
    // For all the dropdown fields, use the dropdown validator
    const cols = _.unzip(answerArray)
    const areColumnsValid = columns.every((columnFormField, i) => {
      return cols[i].every((answer) => {
        return validate(this.formId, columnFormField, answer, isVisible)
      })
    })

    return areColumnsValid
  }
}
module.exports = TableValidator
