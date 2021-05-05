'use strict'

angular.module('forms').component('imageFieldComponent', {
  templateUrl: 'modules/forms/base/componentViews/field-image.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
  },
  controllerAs: 'vm',
})
