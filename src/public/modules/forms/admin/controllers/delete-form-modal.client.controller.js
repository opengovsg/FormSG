'use strict'

angular
  .module('forms')
  .controller('DeleteFormModalController', [
    '$uibModalInstance',
    'externalScope',
    'FormApi',
    '$q',
    DeleteFormModalController,
  ])

function DeleteFormModalController(
  $uibModalInstance,
  externalScope,
  FormApi,
  $q,
) {
  const vm = this

  vm.cancel = function () {
    $uibModalInstance.close('cancel')
  }

  vm.currFormTitle = externalScope.currFormTitle
  vm.myforms = externalScope.myforms

  vm.deleteForm = function () {
    let formIndex = externalScope.formIndex
    if (formIndex >= vm.myforms.length || formIndex < 0) {
      throw new Error(
        `Error: formIndex in removeForm() must be between 0 and ${
          vm.myforms.length - 1
        }`,
      )
    }
    $q.when(FormApi.delete(vm.myforms[formIndex]._id)).then(
      function () {
        vm.myforms.splice(formIndex, 1)
        vm.cancel()
      },
      function (error) {
        console.error(error)
      },
    )
  }
}
