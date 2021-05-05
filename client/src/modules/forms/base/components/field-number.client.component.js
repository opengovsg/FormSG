'use strict'

angular.module('forms').component('numberFieldComponent', {
  templateUrl:
    'modules/forms/base/componentViews/field-number.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
  },
  controllerAs: 'vm',
})
