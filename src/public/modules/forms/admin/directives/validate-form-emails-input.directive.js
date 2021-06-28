'use strict'

const validator = require('validator')

angular
  .module('forms')
  .directive('validateFormEmailsInput', validateFormEmailsInput)

function validateFormEmailsInput() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: (scope, elem, attr, ngModel) => {
      ngModel.$validators.validEmails = (rawInput) => {
        const emails = String(rawInput).split(',')
        return emails.every((email) => validator.isEmail(email.trim()))
      }
      ngModel.$validators.duplicateEmails = (rawInput) => {
        const emails = String(rawInput).split(',')
        const trimmed = emails.map((email) => email.trim())
        return new Set(trimmed).size === emails.length
      }
      ngModel.$validators.maxNumEmails = (rawInput) => {
        const emails = String(rawInput).split(',')
        return emails.length <= 30
      }
    },
  }
}
