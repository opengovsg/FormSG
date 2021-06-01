'use strict'

angular.module('forms').component('mobileFieldComponent', {
  templateUrl:
    'modules/forms/base/componentViews/field-mobile.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
    transactionId: '<',
    formId: '<',
  },
  controllerAs: 'vm',
})
