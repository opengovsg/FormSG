angular
  .module('core')
  .controller('EditContactNumberModalController', [
    '$state',
    '$interval',
    '$http',
    '$timeout',
    '$scope',
    '$uibModalInstance',
    '$window',
    'Auth',
    'Toastr',
    EditContactNumberModalController,
  ])

function EditContactNumberModalController(
  $state,
  $interval,
  $http,
  $timeout,
  $scope,
  $uibModalInstance,
  $window,
  Auth,
  Toastr,
) {
  const vm = this

  let countdownPromise

  const cancelCountdown = () => {
    if (angular.isDefined(countdownPromise)) {
      $interval.cancel(countdownPromise)
      countdownPromise = undefined
      vm.otp.countdown = 0
    }
  }

  // The various states of verification
  const VERIFY_STATE = {
    IDLE: 'IDLE',
    AWAIT: 'AWAITING',
    SUCCESS: 'SUCCESS',
  }

  // Expose so template can use it too.
  vm.VERIFY_STATE = VERIFY_STATE

  // Redirect to signin if unable to get user
  vm.user = Auth.getUser() || $state.go('signin')

  vm.vfnState = vm.user.contact ? VERIFY_STATE.SUCCESS : VERIFY_STATE.IDLE

  vm.contact = {
    number: vm.user.contact || '',
    isFetching: false,
    error: '',
  }

  vm.otp = {
    value: '',
    countdown: 0,
    error: '',
    isFetching: false,
  }

  vm.lastVerifiedContact = vm.user.contact

  vm.resetVfnState = () => {
    // Reset to success state if the number is what is currently stored.
    if (vm.contact.number && vm.contact.number === vm.lastVerifiedContact) {
      vm.vfnState = VERIFY_STATE.SUCCESS
    } else if (vm.vfnState !== VERIFY_STATE.IDLE) {
      // Reset to idle state otherwise so user can verify another number.
      vm.vfnState = VERIFY_STATE.IDLE
    }

    if (vm.contact.error) {
      vm.contact.error = ''
    }

    cancelCountdown()
  }

  vm.resetOtpErrors = () => {
    if (vm.otp.error) {
      vm.otp.error = ''
    }
  }

  vm.sendOtp = async () => {
    if (vm.otp.countdown > 0) return

    vm.contact.isFetching = true
    // Clear previous values, for when resend OTP is clicked.
    vm.otp.value = ''
    $scope.otpForm.otp.$setPristine()
    $scope.otpForm.otp.$setUntouched()
    $http
      .post('/api/v3/user/otp/generate', {
        contact: vm.contact.number,
        userId: vm.user._id,
      })
      .then(() => {
        vm.contact.isFetching = false
        vm.vfnState = VERIFY_STATE.AWAIT
        vm.otp.countdown = 30
        countdownPromise = $interval(
          () => {
            vm.otp.countdown--
          },
          1000,
          30,
        )
      })
      .catch((err) => {
        // Show error message
        vm.contact.error = err.data || 'Failed to send OTP. Please try again'
      })
      .finally(() => {
        vm.contact.isFetching = false
      })
  }

  vm.verifyOtp = async () => {
    vm.otp.isFetching = true
    // Check with backend if the otp is correct
    $http
      .post('/api/v3/user/otp/verify', {
        contact: vm.contact.number,
        otp: vm.otp.value,
        userId: vm.user._id,
      })
      .then((response) => {
        vm.otp.isFetching = false
        vm.vfnState = VERIFY_STATE.SUCCESS

        // Close modal after lag to show success and show toast.
        // Return user back to main controller to update.
        $timeout(() => {
          Toastr.success('Emergency contact number successfully added')
          vm.closeModal(response.data)
        }, 1000)
      })
      .catch((err) => {
        // Show error message
        vm.otp.error = err.data || 'Failed to verify OTP. Please try again'
      })
      .finally(() => {
        vm.otp.isFetching = false
        vm.otp.value = ''
        $scope.otpForm.otp.$setPristine()
        $scope.otpForm.otp.$setUntouched()
      })
  }

  vm.closeModal = function (data) {
    cancelCountdown()
    // Add flag into localstorage so the banner does not open again.
    // The flag will be cleared on user logout.
    $window.localStorage.setItem('contactBannerDismissed', true)
    $uibModalInstance.close(data)
  }
}
