'use strict'

angular
  .module('forms')
  .directive('validateCheckbox', ['$timeout', validateCheckbox])

function validateCheckbox($timeout) {
  return {
    restrict: 'A',
    scope: {
      fieldValue: '<validateCheckbox',
      minSelected: '<',
      maxSelected: '<',
    },
    require: 'ngModel',
    link: function (scope, elem, attrs, ngModel) {
      $timeout(function () {
        ngModel.$validators.checkboxValidator = function (
          _modelValue,
          _viewValue,
        ) {
          const numBoxesChecked = scope.fieldValue.filter(Boolean).length
          if (numBoxesChecked === 0) {
            // Only validate if the field is filled, otherwise leave it to the ng-required validator
            return true
          }

          if (scope.minSelected && numBoxesChecked < scope.minSelected) {
            return false
          }
          if (scope.maxSelected && numBoxesChecked > scope.maxSelected) {
            return false
          }
          return true
        }

        scope.$watch(
          'fieldValue',
          (_newVal, _oldVal) => {
            ngModel.$validate()
          },
          true,
        )

        ngModel.$validate()
      }, 500)
    },
  }
}
