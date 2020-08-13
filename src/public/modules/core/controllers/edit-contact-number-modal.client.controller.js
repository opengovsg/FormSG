angular
  .module('core')
  .controller('EditContactNumberModalController', [
    '$scope',
    '$uibModalInstance',
    'Auth',
    EditContactNumberModalController,
  ])

function EditContactNumberModalController($scope, $uibModalInstance, Auth) {
  const vm = this

  // Various states of submission.
  vm.isLoading = false
  vm.isSuccess = false
  vm.error = null

  // Redirect to signin if unable to get user
  vm.user = Auth.getUser() || $state.go('signin')
  vm.contact = vm.user.contact || ''


  vm.resetSubmissionState = () => {
    // Reset to success state if the number is what is currently stored.
    vm.isSuccess = vm.contact && vm.contact === vm.user.contact
  }

  vm.updateContactNumber = async () => {
    const userId = vm.user._id
    vm.isLoading = true
    try {
      // await Auth.updateEmergencyContactOtp(
      //   userId,
      //   vm.contact.number,
      // );
      vm.isSuccess = true
      vm.user.contact = vm.contact
    } catch (err) {
      // Show error message
      vm.error = err
    } finally {
      vm.isLoading = false
    }
  }

  vm.closeModal = function () {
    $uibModalInstance.close()
  }
}
