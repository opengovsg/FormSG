'use strict'

angular.module('forms').component('nricFieldComponent', {
  templateUrl: 'modules/forms/base/componentViews/field-nric.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
  },
  controllerAs: 'vm',
})
