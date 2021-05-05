'use strict'

angular
  .module('forms')
  .controller('MobileEditFieldsModalController', [
    '$uibModalInstance',
    'externalScope',
    MobileEditFieldsModalController,
  ])

function MobileEditFieldsModalController($uibModalInstance, externalScope) {
  const vm = this

  // Clone is necessary so we don't mutate the external scope
  vm.addField = angular.copy(externalScope.addField)

  // Hack: Add empty field types to left align last row
  // with center-aligned flex wrap
  let numTypes = vm.addField.types.length
  for (let i = 0; i < numTypes; i++) {
    vm.addField.types.push({ name: '', value: '' })
  }

  // Add 10 of each MyInfo category:
  // 10 is used because 768px is the cut-off for mobile screens, and
  // each icon takes up about 60ish px. This means if the last row has
  // only one icon, there will be enough icons to add on to that row such
  // that that one icon is left aligned
  let categories = vm.addField.myInfoTypes.reduce((a, d) => {
    if (!a.includes(d.category)) {
      a.push(d.category)
    }
    return a
  }, [])
  categories.forEach((ctgy) => {
    for (let i = 0; i < 10; i++) {
      vm.addField.myInfoTypes.push({
        name: '',
        value: '',
        category: ctgy,
      })
    }
  })

  // Assign external functions to modal scope
  vm.addNewField = externalScope.addNewField
  vm.addNewMyInfoField = externalScope.addNewMyInfoField
  vm.isDisabledField = externalScope.isDisabledField
  vm.adminHasAccess = externalScope.adminHasAccess
  vm.myform = externalScope.myform
  vm.isStorageForm = externalScope.isStorageForm
}
