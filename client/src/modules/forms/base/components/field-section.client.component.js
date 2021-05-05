'use strict'

angular.module('forms').component('sectionFieldComponent', {
  templateUrl:
    'modules/forms/base/componentViews/field-section.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
    colortheme: '<',
  },
  controllerAs: 'vm',
})
