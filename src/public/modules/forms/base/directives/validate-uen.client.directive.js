'use strict'

const { isUenValid } = require('../../../../../../shared/util/uen-validation')

angular.module('forms').directive('validateUen', validateUen)

function validateUen() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (_scope, _elem, _attrs, ctrl) {
      ctrl.$validators.uenValidator = function (modelValue) {
        return ctrl.$isEmpty(modelValue) ? true : isUenValid(modelValue)
      }
    },
  }
}
