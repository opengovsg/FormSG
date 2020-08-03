'use strict'

angular.module('forms').component('emailFieldComponent', {
  templateUrl: 'modules/forms/base/componentViews/field-email.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
    transactionId: '<',
  },
  controller: emailFieldComponentController,
  controllerAs: 'vm',
})

function emailFieldComponentController() {
  const vm = this

  // Email validator from validator.js
  // https://github.com/skaterdav85/validatorjs/blob/7cdb58f064a77237de13072057dc35e61755a7f5/src/rules.js#L166
  vm.pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
}
