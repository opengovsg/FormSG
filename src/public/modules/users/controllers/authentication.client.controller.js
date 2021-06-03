'use strict'

const HttpStatus = require('http-status-codes')
const AdminAuthService = require('../../../services/AdminAuthService')

angular
  .module('users')
  .controller('AuthenticationController', [
    '$q',
    '$scope',
    '$state',
    '$timeout',
    '$window',
    'Auth',
    'GTag',
    AuthenticationController,
  ])

function AuthenticationController(
  $q,
  $scope,
  $state,
  $timeout,
  $window,
  Auth,
  GTag,
) {
  const vm = this

  let notifDelayTimeout

  vm.credentials = {}
  vm.buttonClicked = false
  vm.showOtpDelayNotification = false

  // logic/booleans to show sign in process sequentially. 2 possible values.
  // 'email' - email input
  // 'otp' - otp input
  vm.signInSteps = 'email'

  // Banner message on login
  vm.loginBannerContent = $window.siteBannerContent || $window.isLoginBanner

  // logic/booleans to show error/success messages
  vm.signInMsg = {
    isMsg: false,
    isError: true,
    msg: null,
  }

  // boolean to enable/disable email submit button
  vm.isSubmitEmailDisabled = false

  /**
   * Action on keyup for email input
   */

  vm.handleEmailKeyUp = function (e) {
    if (e.keyCode == 13) {
      vm.isSubmitEmailDisabled === false && vm.login()
      // condition vm.isSubmitEmailDisabled == false is necessary to prevent retries using enter key
      // when submit button is disabled
    } else {
      vm.removeError(e)
      vm.isSubmitEmailDisabled = false
    }
  }

  /**
   * Redirects user with active session to target page
   */
  vm.redirectIfActiveSession = function () {
    if (Auth.getUser()) {
      $state.go($state.params.targetState)
    }
  }

  /**
   * Removes error messages from email input box
   * @param  {Object} e - Keyboard event object
   */
  vm.removeError = function (e) {
    if (e.keyCode !== 13) {
      vm.signInMsg.isMsg = false
    }
  }

  /**
   * Disallows user from inputing letters into OTP field
   * @param  {Object} e - Keyboard event object
   */
  vm.manageOtp = function (e) {
    let charCode = e.keyCode
    let allowChar
    if (
      charCode === 37 ||
      charCode === 38 ||
      charCode === 39 ||
      charCode === 40 ||
      charCode === 46 ||
      e.ctrlKey ||
      e.metaKey
    ) {
      allowChar = true // for arrow keys, delete key and cntrl key
    } else if (e.shiftKey) {
      allowChar = false // user pressed the shift key
    } else if (
      charCode <= 31 ||
      (charCode >= 48 && charCode <= 57) ||
      (charCode >= 96 && charCode <= 105)
    ) {
      allowChar = true // for numeric character and ascii char from 1 to 31
    } else {
      allowChar = false
    }
    if (allowChar === false) {
      e.preventDefault()
    }
  }

  // Steps of sign-in process
  // 1 - Check if user email is in valid format
  // 2 - Check if user's email domain (i.e. agency) is valid
  // 3 - Send OTP to user email
  // 4 - Verify OTP

  /**
   * Checks validity of email domain (i.e. agency) and sends login OTP if email
   * is valid.
   */
  vm.login = function () {
    vm.buttonClicked = true
    $q.when(AdminAuthService.checkIsEmailAllowed(vm.credentials.email))
      .then(() => vm.sendOtp())
      .catch((error) => {
        // Invalid agency
        vm.buttonClicked = false
        vm.signInMsg = {
          isMsg: true,
          isError: true,
          msg: error.message,
        }
        vm.isSubmitEmailDisabled = true
      })
  }

  /**
   * Sends otp to user email
   */
  vm.sendOtp = function () {
    // Show opt input section
    vm.signInSteps = 'otp'
    vm.signInMsg.isMsg = false
    vm.isOtpSending = true
    vm.buttonClicked = true
    vm.showOtpDelayNotification = false

    $q.when(AdminAuthService.sendLoginOtp(vm.credentials.email))
      .then((success) => {
        vm.isOtpSending = false
        vm.buttonClicked = false
        // Configure message to be show
        vm.signInMsg = {
          isMsg: true,
          isError: false,
          msg: success,
        }
        $timeout(function () {
          angular.element('#otp-input').focus()
          angular.element('#otp-input').select()
        }, 100)

        // Cancel existing timeout and set new one.
        cancelNotifDelayTimeout()
        notifDelayTimeout = $timeout(function () {
          vm.signInMsg.isMsg = false
          vm.showOtpDelayNotification = true
        }, 20000)
      })
      .catch((error) => {
        vm.isOtpSending = false
        vm.buttonClicked = false
        // Configure message to be shown
        vm.signInMsg = {
          isMsg: true,
          isError: true,
          msg: error.message,
        }
      })
  }

  /**
   * Verifies otp inputted
   */
  vm.verifyOtp = function () {
    vm.buttonClicked = true
    Auth.verifyOtp(vm.credentials).then(
      function () {
        vm.buttonClicked = false
        // Configure message to be show
        vm.signInMsg = {
          isMsg: true,
          isError: false,
          msg: 'OTP Verified!',
        }
        // Add lag between approval of otp and redirection to target page
        $timeout(function () {
          // If using the /:formId/use-template link, send client to that state along with the targetFormId
          if ($state.params.targetFormId) {
            $state.go($state.params.targetState, {
              formId: $state.params.targetFormId,
            })
            // Otherwise just send client to the target state
          } else {
            $state.go($state.params.targetState)
          }
        }, 500)

        GTag.loginSuccess('otp')
      },
      function (error) {
        vm.buttonClicked = false
        // Configure message to be show
        vm.signInMsg = {
          isMsg: true,
          isError: true,
          msg:
            error.status >= HttpStatus.INTERNAL_SERVER_ERROR
              ? 'An unknown error occurred'
              : error.data,
        }
        $timeout(function () {
          angular.element('#otp-input').focus()
          angular.element('#otp-input').select()
        }, 100)
        GTag.loginFailure('otp', String(error.status || error.data || ''))
      },
    )
  }

  const cancelNotifDelayTimeout = () => {
    if (notifDelayTimeout) {
      $timeout.cancel(notifDelayTimeout)
    }
  }

  $scope.$on('$destroy', function () {
    cancelNotifDelayTimeout()
  })
}
