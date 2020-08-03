'use strict'

angular.module('forms').component('ratingFieldComponent', {
  templateUrl:
    'modules/forms/base/componentViews/field-rating.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
    colortheme: '<',
  },
  controllerAs: 'vm',
})
