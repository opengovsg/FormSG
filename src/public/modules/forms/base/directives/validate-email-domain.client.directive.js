'use strict'

angular.module('forms').directive('validateEmailDomain', validateEmailDomain)

function validateEmailDomain() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: (scope, elem, attr, ngModel) => {
      const allowedEmailDomains = scope.vm.field.isVerifiable
        ? new Set(scope.vm.field.allowedEmailDomains)
        : new Set()
      ngModel.$validators.emailDomainValidator = (emailAddress) => {
        // Early return, do not even check domains if string is empty.
        if (!emailAddress) {
          return true
        }
        if (allowedEmailDomains.size) {
          const emailDomain = emailAddress.split('@').pop()
          return allowedEmailDomains.has('@' + emailDomain)
        }
        return true
      }
    },
  }
}
