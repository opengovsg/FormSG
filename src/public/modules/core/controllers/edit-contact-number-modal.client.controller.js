angular
  .module('core')
  .controller('EditContactNumberModalController', [
    '$uibModalInstance',
    '$timeout',
    EditContactNumberModalController,
  ])

function EditContactNumberModalController(
  $uibModalInstance,
  $timeout,
) {
  const vm = this

  vm.closeModal = function () {
    $uibModalInstance.close()
  }
}
