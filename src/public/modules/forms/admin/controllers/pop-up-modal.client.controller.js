'use strict'

angular
  .module('forms')
  .controller('PopUpModalController', [
    '$uibModalInstance',
    'externalScope',
    PopUpModalController,
  ])

function PopUpModalController($uibModalInstance, externalScope) {
  const vm = this

  vm.title = externalScope.title
  vm.description = externalScope.description
  vm.confirmButtonText = externalScope.confirmButtonText
  vm.cancelButtonText = externalScope.cancelButtonText
  vm.cancel = $uibModalInstance.close

  vm.confirm = function () {
    $uibModalInstance.close()
    if (externalScope.onConfirm) {
      externalScope.onConfirm()
    }
  }
}
