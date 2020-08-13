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

  // The various states of verification
  const VERIFY_STATE = {
    IDLE: 'IDLE',
    AWAIT: 'AWAITING',
    SUCCESS: 'SUCCESS',
  }

  vm.isFetching = false

  // Expose so template can use it too.
  vm.VERIFY_STATE = VERIFY_STATE

  // Redirect to signin if unable to get user
  vm.user = Auth.getUser() || $state.go('signin')

  vm.vfnState = vm.user.contact ? VERIFY_STATE.SUCCESS : VERIFY_STATE.IDLE

  vm.contact = {
    number: vm.user.contact || '',
  }

  vm.otp = {
    value: '',
    countdown: 0
  }

  vm.lastVerifiedContact = vm.user.contact

  vm.resetVfnState = () => {
    // Reset to success state if the number is what is currently stored.
    if (vm.contact.number && vm.contact.number === vm.lastVerifiedContact) {
      vm.vfnState = VERIFY_STATE.SUCCESS
      return
    }

    // Reset to idle state otherwise so user can verify another number.
    if (vm.vfnState !== VERIFY_STATE.IDLE) {
      vm.vfnState = VERIFY_STATE.IDLE
    }
  }

  vm.sendOtp = async () => {
    const userId = vm.user._id
    vm.isFetching = true
    try {
      // await Verification.sendEmergencyContactOtp(
      //   userId,
      //   vm.contact.number,
      // );
      vm.vfnState = VERIFY_STATE.AWAIT
    } catch (err) {
      // Show error message
    } finally {
      vm.isFetching = false
    }
  }

  vm.verifyOtp = async () => {
    vm.isFetching = true
    try {
      // Check with backend if the otp is correct
      vm.vfnState = VERIFY_STATE.SUCCESS
    } catch (err) {
      // Show error message
    } finally {
      vm.isFetching = false
      vm.otp.value = ''
      $scope.otpForm.otp.$setPristine()
      $scope.otpForm.otp.$setUntouched()
    }
  }

  vm.closeModal = function () {
    $uibModalInstance.close()
  }
}
