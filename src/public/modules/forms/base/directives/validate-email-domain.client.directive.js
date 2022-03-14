'use strict'

angular.module('forms').directive('validateEmailDomain', validateEmailDomain)

function validateEmailDomain() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: (scope, elem, attr, ngModel) => {
      const allowedEmailDomains =
        scope.vm.field.isVerifiable && scope.vm.field.hasAllowedEmailDomains
          ? new Set(
              scope.vm.field.allowedEmailDomains.map((domain) =>
                domain.toLowerCase(),
              ),
            )
          : new Set()
      ngModel.$validators.emailDomainValidator = (emailAddress) => {
        // Early return, do not even check domains if string is empty.
        if (!emailAddress) {
          return true
        }
        if (allowedEmailDomains.size) {
          const emailDomain = (
            '@' + emailAddress.split('@').pop()
          ).toLowerCase()
          return allowedEmailDomains.has(emailDomain)
        }
        return true
      }
    },
  }
}
