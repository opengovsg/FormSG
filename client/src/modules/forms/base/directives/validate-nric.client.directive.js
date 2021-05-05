'use strict'

const { isNricValid } = require('shared/util/nric-validation')

angular.module('forms').directive('validateNric', validateNric)

function validateNric() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (_scope, _elem, _attrs, ctrl) {
      ctrl.$validators.nricValidator = function (modelValue) {
        return ctrl.$isEmpty(modelValue) ? true : isNricValid(modelValue)
      }
    },
  }
}
