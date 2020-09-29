'use strict'

const { validateEmailDomains } = require('shared/util/email-domain-validation')

angular
  .module('forms')
  .directive('validateEmailDomainFromText', validateEmailDomainFromText)

function validateEmailDomainFromText() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: (scope, elem, attr, ngModel) => {
      ngModel.$validators.emailDomainFromTextValidator = (
        allowedEmailDomainsFromText,
      ) => {
        if (!allowedEmailDomainsFromText) {
          return true
        }
        // The last `filter` chain is needed to remove falsey values from the array e.g. [''].
        const emailDomains = allowedEmailDomainsFromText
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => s)
        return validateEmailDomains(emailDomains)
      }
    },
  }
}
