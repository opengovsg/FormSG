'use strict'

angular
  .module('forms')
  .directive('isVerifiableSaveInterceptor', isVerifiableSaveInterceptor)

function isVerifiableSaveInterceptor() {
  return {
    require: 'ngModel',
    link: (scope, elem, attr, ngModel) => {
      ngModel.$parsers.push((inputValue) => {
        if (!inputValue) {
          scope.vm.field.hasAllowedEmailDomains = false
        }
        return inputValue
      })
    },
  }
}
