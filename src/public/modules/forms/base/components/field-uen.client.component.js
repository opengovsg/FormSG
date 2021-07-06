'use strict'

angular.module('forms').component('uenFieldComponent', {
  templateUrl: 'modules/forms/base/componentViews/field-uen.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
  },
  controllerAs: 'vm',
})
