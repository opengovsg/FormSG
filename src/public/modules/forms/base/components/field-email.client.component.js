'use strict'

angular.module('forms').component('emailFieldComponent', {
  templateUrl: 'modules/forms/base/componentViews/field-email.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
    transactionId: '<',
  },
  controllerAs: 'vm',
})
