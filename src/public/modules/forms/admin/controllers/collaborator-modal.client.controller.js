'use strict'

angular
  .module('forms')
  .controller('CollaboratorModalController', [
    '$scope',
    '$uibModalInstance',
    'FormApi',
    CollaboratorModalController,
  ])

function CollaboratorModalController($scope, $uibModalInstance, FormApi) {
  $scope.isDisplayTransferOwnerModal = false
  $scope.isDisplayTransferSuccessMessage = false
  $scope.isDisplayTransferFailedMessage = false
  $scope.transferOwnerEmail = undefined
  $scope.transferErrorMessage = undefined

  /**
   *  Handle modal close click
   */
  $scope.closeModal = () => {
    $uibModalInstance.close('cancel')
  }

  $scope.transferOwner = () => {
    $scope.resetMessages()
    FormApi.transferOwner(
      { formId: $scope.myform._id },
      { email: $scope.transferOwnerEmail },
    )
      .$promise.then((res) => {
        $scope.myform = res.form
        $scope.isDisplayTransferSuccessMessage = true
      })
      .catch((err) => {
        $scope.transferErrorMessage = err.data.message
        $scope.isDisplayTransferFailedMessage = true
      })
      .finally(() => {
        $scope.isDisplayTransferOwnerModal = false
      })
  }

  $scope.resetMessages = () => {
    $scope.isDisplayTransferSuccessMessage = false
    $scope.isDisplayTransferFailedMessage = false
    $scope.transferErrorMessage = undefined
  }

  $scope.handleTransferOwnerButtonClick = () => {
    const email = $scope.collab.form.email.toLowerCase()
    $scope.transferOwnerEmail = email
    $scope.toggleTransferOwnerModal()
  }

  $scope.handleUpdateRoleToOwner = (index) => {
    const email = $scope.myform.permissionList[index].email
    $scope.transferOwnerEmail = email
    $scope.toggleTransferOwnerModal()
    $scope.collab.collaboratorDropdownsOpen[index] = false
  }

  $scope.toggleTransferOwnerModal = () => {
    $scope.isDisplayTransferOwnerModal = !$scope.isDisplayTransferOwnerModal
  }
}
