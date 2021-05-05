'use strict'

// Configuring the Forms drop-down menus
angular.module('forms').filter('addFieldNumber', addFieldNumber)

function addFieldNumber() {
  // Calculates the question number to display on the form
  return function (fields) {
    if (fields) {
      let nonResponseFields = 0
      let numHiddenFields = 0

      fields.forEach(function (field, index) {
        if (['section', 'statement', 'image'].includes(field.fieldType)) {
          nonResponseFields++
        } else if (!field.isVisible) {
          numHiddenFields++
        } else {
          field.field_number = index + 1 - nonResponseFields - numHiddenFields
        }
      })
    }
    return fields
  }
}
