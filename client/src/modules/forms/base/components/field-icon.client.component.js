'use strict'

const { iconTypeMap } = require('../resources/icon-types')

angular.module('forms').component('fieldIconComponent', {
  template: '<i class="{{ vm.typeIcon }}"></i>',
  bindings: {
    typeName: '@',
  },
  controller: fieldIconController,
  controllerAs: 'vm',
})

function fieldIconController() {
  const vm = this

  vm.$onChanges = (changes) => {
    if (changes.typeName) {
      vm.typeIcon = iconTypeMap[vm.typeName]
    }
  }
}
