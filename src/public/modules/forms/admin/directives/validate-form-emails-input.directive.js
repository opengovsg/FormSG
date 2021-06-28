'use strict'

const validator = require('validator')
const get = require('lodash/get')

angular
  .module('forms')
  .directive('validateFormEmailsInput', validateFormEmailsInput)

function validateFormEmailsInput() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: (scope, _elem, _attr, ngModel) => {
      ngModel.$validators.validEmails = (rawInput) => {
        const emails = String(rawInput).split(',')
        return (
          get(scope, 'vm.formData.responseMode') !== 'email' ||
          emails.every((email) => validator.isEmail(email.trim()))
        )
      }
      ngModel.$validators.duplicateEmails = (rawInput) => {
        const emails = String(rawInput).split(',')
        const trimmed = emails.map((email) => email.trim())
        return (
          get(scope, 'vm.formData.responseMode') !== 'email' ||
          new Set(trimmed).size === emails.length
        )
      }
      ngModel.$validators.maxNumEmails = (rawInput) => {
        const emails = String(rawInput).split(',')
        return (
          get(scope, 'vm.formData.responseMode') !== 'email' ||
          emails.length <= 30
        )
      }
    },
  }
}
