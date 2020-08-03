'use strict'

angular.module('forms').component('checkboxFieldComponent', {
  templateUrl:
    'modules/forms/base/componentViews/field-checkbox.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
    colortheme: '<',
  },
  controller: checkboxFieldComponentController,
  controllerAs: 'vm',
})

function checkboxFieldComponentController() {
  const vm = this

  vm.$onInit = () => {
    vm.field.fieldValue = Array(vm.field.fieldOptions.length + 1).fill(false)
  }

  vm.focusCustomCheckbox = function (selectedOthersCheckbox, _id) {
    if (selectedOthersCheckbox === true) {
      angular.element('.' + _id).focus()
    }
  }
}
