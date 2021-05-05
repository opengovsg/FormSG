'use strict'

angular.module('forms').component('fieldErrorComponent', {
  bindings: {
    text: '<',
  },
  templateUrl: 'modules/forms/base/componentViews/fieldError.html',
  controller: [fieldErrorController],
  controllerAs: 'vm',
})

function fieldErrorController() {
  const vm = this
  vm.$onInit = () => {
    vm.text = vm.text || 'Please fill in required field'
  }
}
