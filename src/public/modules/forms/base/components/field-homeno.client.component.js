'use strict'

angular.module('forms').component('homenoFieldComponent', {
  templateUrl:
    'modules/forms/base/componentViews/field-homeno.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
  },
  controllerAs: 'vm',
})
