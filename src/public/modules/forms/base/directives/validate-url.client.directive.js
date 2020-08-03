'use strict'

const { isValidHttpsUrl } = require('../../../../../shared/util/url-validation')

angular.module('forms').directive('validateUrl', validateUrl)

function validateUrl() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (_scope, _elem, _attrs, ctrl) {
      ctrl.$validators.urlValidator = (modelValue) =>
        ctrl.$isEmpty(modelValue) || isValidHttpsUrl(modelValue)
    },
  }
}
