'use strict'

const {
  isCountryValid,
} = require('../../../../../shared/util/country-validation')

angular.module('forms').directive('validateCountry', validateCountry)

function validateCountry() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (_scope, _elem, _attrs, ctrl) {
      ctrl.$validators.countryValidator = function (modelValue) {
        return ctrl.$isEmpty(modelValue) ? true : isCountryValid(modelValue)
      }
    },
  }
}
