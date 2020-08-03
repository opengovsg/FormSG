'use strict'

angular.module('forms').component('textFieldComponent', {
  templateUrl:
    'modules/forms/base/componentViews/field-textfield.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
    placeholder: '<',
  },
  controllerAs: 'vm',
})
