'use strict'

angular.module('forms').component('yesNoFieldComponent', {
  templateUrl:
    'modules/forms/base/componentViews/field-yes-no.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
    colortheme: '<',
  },
  controller: yesNoFieldComponentController,
  controllerAs: 'vm',
})

function yesNoFieldComponentController() {
  const vm = this

  vm.$onInit = () => {
    vm.field.fieldValue = ''
  }

  vm.selectYesNo = function (event, field) {
    let yesNoSelector = event.currentTarget.parentElement.parentElement
    let lastSelectedDataSource = 'data-last-selected'
    let lastSelected = yesNoSelector.getAttribute(lastSelectedDataSource)
    if (lastSelected !== undefined) {
      if (lastSelected === event.target.value) {
        field.fieldValue = ''
        yesNoSelector.setAttribute(lastSelectedDataSource, '')
      } else {
        yesNoSelector.setAttribute(lastSelectedDataSource, event.target.value)
      }
    }
  }
}
