'use strict'

angular.module('forms').component('countryFieldComponent', {
  templateUrl:
    'modules/forms/base/componentViews/field-dropdown.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
  },
  controllerAs: 'vm',
})
