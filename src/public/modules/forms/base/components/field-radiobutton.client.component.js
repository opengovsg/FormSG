'use strict'

angular.module('forms').component('radioButtonFieldComponent', {
  templateUrl:
    'modules/forms/base/componentViews/field-radiobutton.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
    colortheme: '<',
  },
  controller: radioButtonFieldComponentController,
  controllerAs: 'vm',
})

function radioButtonFieldComponentController() {
  const vm = this

  vm.selectRadioBtn = function (event, field) {
    let id = field._id || 'defaultID'
    let lastSelectedRadio = angular.element('#radio' + id)
    if (lastSelectedRadio.data('last-selected') === event.target.value) {
      field.fieldValue = ''
      lastSelectedRadio.data('last-selected', '')
    } else {
      lastSelectedRadio.data('last-selected', event.target.value)
      if (event.target.value === 'radioButtonOthers') {
        angular.element('#others' + id).focus()
      }
    }
  }

  vm.selectRadioOthers = function (_id) {
    angular.element('#radio' + _id).data('last-selected', 'radioButtonOthers')
    vm.field.fieldValue = 'radioButtonOthers'
  }
}
