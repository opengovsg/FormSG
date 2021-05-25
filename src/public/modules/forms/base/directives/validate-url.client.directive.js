'use strict'

const {
  isValidHttpsUrl,
  isValidUrl,
} = require('../../../../../shared/util/url-validation')

angular.module('forms').directive('validateUrl', validateUrl)

function validateUrl() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (_scope, _elem, attrs, ctrl) {
      ctrl.$validators.urlValidator = (modelValue) => {
        if (attrs.allowHttp) {
          return ctrl.$isEmpty(modelValue) || isValidUrl(modelValue)
        }
        return ctrl.$isEmpty(modelValue) || isValidHttpsUrl(modelValue)
      }
    },
  }
}
