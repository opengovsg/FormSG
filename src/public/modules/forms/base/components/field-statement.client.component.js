'use strict'

angular.module('forms').component('statementFieldComponent', {
  templateUrl:
    'modules/forms/base/componentViews/field-statement.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
  },
  controllerAs: 'vm',
})
