'use strict'

angular.module('forms').component('textareaFieldComponent', {
  templateUrl:
    'modules/forms/base/componentViews/field-textarea.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
  },
  controllerAs: 'vm',
})
