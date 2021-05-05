'use strict'

const { isEmail } = require('validator')
angular.module('forms').directive('validateEmailFormat', validateEmailFormat)

function validateEmailFormat() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: (scope, elem, attr, ngModel) => {
      ngModel.$validators.emailFormatValidator = (emailAddress) => {
        return !emailAddress || isEmail(emailAddress)
      }
    },
  }
}
