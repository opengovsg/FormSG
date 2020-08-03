'use strict'

angular
  .module('forms')
  .controller('DeleteFieldWarningController', [
    '$uibModalInstance',
    'processDelete',
    DeleteFieldWarningController,
  ])

function DeleteFieldWarningController($uibModalInstance, processDelete) {
  const vm = this

  vm.confirmDeleteField = function () {
    processDelete().then((error) => {
      if (!error) {
        $uibModalInstance.close()
      }
    })
  }

  vm.closeDeleteFieldWarningModal = function () {
    $uibModalInstance.close()
  }
}
