'use strict'

const app = angular.module('forms')

app.component('emailFieldComponent', {
  templateUrl: 'modules/forms/base/componentViews/field-email.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
    transactionId: '<',
  },
  controller: emailFieldComponentController,
  controllerAs: 'vm',
})

app.directive('validateEmailDomain', () => {
  return {
    require: 'ngModel',
    link: (scope, elem, attr, ngModel) => {
      const allowedEmailDomains = scope.vm.field.isVerifiable && scope.vm.field.hasAllowedEmailDomains ? new Set(scope.vm.field.allowedEmailDomains) : new Set()
      ngModel.$validators.emailDomainValidator = (emailAddress) => {
        if (allowedEmailDomains.size) {
          const emailDomain = emailAddress.split('@').pop()
          return allowedEmailDomains.has('@' + emailDomain)
        }
        return true
      }
    }
  }
})

function emailFieldComponentController() {
  const vm = this

  // Email validator from validator.js
  // https://github.com/skaterdav85/validatorjs/blob/7cdb58f064a77237de13072057dc35e61755a7f5/src/rules.js#L166
  vm.pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
}
