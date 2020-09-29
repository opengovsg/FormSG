'use strict'

angular.module('forms').directive('validateEmailDomain', validateEmailDomain)

function validateEmailDomain() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: (scope, elem, attr, ngModel) => {
      const allowedEmailDomains =
        scope.vm.field.isVerifiable && scope.vm.field.hasAllowedEmailDomains
          ? new Set(scope.vm.field.allowedEmailDomains)
          : new Set()
      ngModel.$validators.emailDomainValidator = (emailAddress) => {
        if (allowedEmailDomains.size) {
          const emailDomain = emailAddress.split('@').pop()
          return allowedEmailDomains.has('@' + emailDomain)
        }
        return true
      }
    },
  }
}
