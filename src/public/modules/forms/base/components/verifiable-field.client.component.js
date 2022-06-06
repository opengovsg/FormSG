'use strict'
const { isEmpty, merge, keys, get } = require('lodash')
const FieldVerificationService = require('../../../../services/FieldVerificationService')
angular.module('forms').component('verifiableFieldComponent', {
  transclude: true,
  templateUrl: 'modules/forms/base/componentViews/verifiable-field.html',
  bindings: {
    transactionId: '<',
    field: '<', // The model that the input field is based on
    input: '<',
    formId: '<',
  },
  controller: ['$q', '$timeout', '$interval', verifiableFieldController],
  controllerAs: 'vm',
})

function verifiableFieldController($q, $timeout, $interval) {
  const vm = this
  vm.$onInit = () => {
    vm.otp = {
      id: `otp-${vm.field._id}`,
      value: '',
    }
    updateView(getView())
    vm.isLoading = false
  }

  vm.handleChange = () => {
    if (vm.vfnSection[vm.otp.id].$dirty) {
      vm.clearOtpError()
    }
  }

  vm.getNewOtp = async () => {
    if (!vm.field.isVerifiable) {
      return
    }
    updateView(STATES.VFN_REQUESTED)
    vm.isLoading = true
    try {
      lastRequested.value = vm.field.fieldValue
      clearOtpInput()
      vm.clearOtpError()

      // No id found, jump straight to failure
      if (!vm.transactionId) {
        throw new Error(
          'Unable to generate OTP. Please refresh the page and try again.',
        )
      }

      await FieldVerificationService.triggerSendOtp({
        formId: vm.formId,
        transactionId: vm.transactionId,
        fieldId: vm.field._id,
        answer: lastRequested.value,
      })
      disableResendButton(DISABLED_SECONDS)
      updateView(STATES.VFN_WAITING_FOR_INPUT)
    } catch (err) {
      updateView(STATES.VFN_ERROR, getErrorMessage(err))
    } finally {
      vm.isLoading = false
    }
  }

  vm.verifyOtp = async (otp) => {
    if (!vm.field.isVerifiable) {
      return
    }
    vm.isLoading = true
    updateView(STATES.VFN_SUBMITTED)
    try {
      if (vm.field.fieldValue !== lastRequested.value) {
        throw new Error(
          `Current value ${vm.field.fieldValue} does not match the value that an otp was requested for`,
        )
      }

      // No id found, jump straight to failure
      if (!vm.transactionId) {
        return onVerificationFailure()
      }

      $q.resolve(
        FieldVerificationService.verifyOtp({
          formId: vm.formId,
          transactionId: vm.transactionId,
          fieldId: vm.field._id,
          otp,
        }),
      )
        .then(onVerificationSuccess)
        .catch(onVerificationFailure)
    } catch (err) {
      updateView(STATES.VFN_ERROR, getErrorMessage(err))
      updateInputValidity(lastRequested.verified)
    } finally {
      vm.isLoading = false
    }
  }

  vm.resetFieldInTransaction = () => {
    if (!vm.field.isVerifiable) {
      return
    }

    try {
      // Restores the verified state if input was not changed
      if (
        vm.field.fieldValue === lastRequested.value &&
        lastRequested.verified
      ) {
        onVerificationSuccess(lastRequested.signature)
      } else {
        if (getView() !== STATES.VFN_DEFAULT) {
          // We don't await on reset because we don't care if it fails
          // The signature will be wrong anyway if it fails, and submission will be prevented
          FieldVerificationService.resetVerifiedField({
            formId: vm.formId,
            transactionId: vm.transactionId,
            fieldId: vm.field._id,
          })
        }
        resetDefault()
      }
    } catch (err) {
      updateView(STATES.VFN_ERROR, getErrorMessage(err))
    }
  }

  vm.clearOtpError = () => {
    $timeout(() => {
      vm.display.err = ''
    })
  }

  /**
   * If there is no input in the verifiable field, or if the verifiable field has any errors besides 'verified' (eg. format),
   * the `verify` button will be disabled.
   */
  vm.isInputValid = () => {
    // Mobile input appears to compile after this controller has been instantiated,
    // due to the strange ng-if and duplication of input in mobile.html,
    // which causes vm.input to be undefined initially.
    // Hence, we check for the presence of vm.input
    if (vm.input) {
      const errors = keys(vm.input.$error)
      const fieldHasValue = !isEmpty(vm.field.fieldValue)
      const fieldHasNoErrors = errors.length === 0
      const fieldHasOnlyVerifiedError =
        errors.length === 1 && errors[0] === 'verified'
      return fieldHasValue && (fieldHasNoErrors || fieldHasOnlyVerifiedError)
    }
    return true
  }

  /**
   * Counter for seconds to wait till resend can occur
   */
  vm.countdown = 0

  /**
   * State for the last verified value
   * If user verifies x@y.com then changes it to another value, then changes it back, they should not need to reverify that value.
   */
  const lastRequested = {
    _value: null,
    _verified: false,
    _signature: null,
    get value() {
      return this._value
    },
    set value(value) {
      this._value = value
      this._verified = false
      this._signature = null
    },
    get verified() {
      return this._verified
    },
    set verified(value) {
      this._verified = value
    },
    get signature() {
      return this._signature
    },
    set signature(value) {
      this._signature = value
    },
  }

  let _view = STATES.VFN_DEFAULT

  const updateView = (value, errMessage) => {
    _view = value
    vm.display = merge(vm.display, DISPLAY[_view])
    if (_view === STATES.VFN_ERROR) {
      $timeout(() => {
        vm.display.err = errMessage
      })
    }
  }

  const getView = () => _view

  const resetDefault = () => {
    delete vm.field.signature
    updateInputValidity(isEmpty(vm.field.fieldValue))
    updateView(STATES.VFN_DEFAULT)
  }

  const clearOtpInput = () => {
    vm.vfnSection[vm.otp.id].$setUntouched()
    vm.vfnSection[vm.otp.id].$setPristine()
    vm.otp.value = ''
  }

  const updateInputValidity = (isValid) => {
    vm.input.$setValidity('verified', isValid)
  }

  const disableResendButton = (seconds) => {
    vm.display.resendBtn.overrideDisabled = true
    vm.countdown = seconds
    $interval(
      () => {
        vm.countdown--
      },
      1000,
      seconds,
    )
    $timeout(() => {
      // Re-enable it when seconds have elapsed
      vm.display.resendBtn.overrideDisabled = false
    }, seconds * 1000)
  }

  const onVerificationSuccess = (signature) => {
    lastRequested.verified = true
    lastRequested.signature = signature
    vm.field.signature = signature
    updateInputValidity(lastRequested.verified)
    updateView(STATES.VFN_SUCCESS)
  }

  const onVerificationFailure = (err) => {
    lastRequested.verified = false
    updateInputValidity(lastRequested.verified)
    updateView(STATES.VFN_ERROR, getErrorMessage(err))
  }

  const getErrorMessage = (err) => {
    // TODO (#941): keep only this code, remove switch case for custom strings
    const serverErrorMsg = get(err, 'response.data.message')
    if (serverErrorMsg) return serverErrorMsg

    // So that switch case works for both axios error objects and string objects.
    const error = get(err, 'response.data', err)
    let errMessage = ''
    switch (error) {
      case 'SEND_OTP_FAILED':
      case 'RESEND_OTP':
        errMessage = 'Error - try resending the OTP.'
        break
      case 'INVALID_OTP':
        errMessage = 'Wrong OTP'
        break
      case 'INVALID_MOBILE_NUMBER':
        errMessage = 'Error - Please enter a valid number.'
        break
      default:
        errMessage = error || 'Error - please refresh the form.'
    }
    return errMessage
  }
}

const DISABLED_SECONDS = 30

const STATES = {
  /*
        Answer has been updated - verify button has not been pressed.
    */
  VFN_DEFAULT: 'VFN_DEFAULT',
  /*
         A request to get otp has been made
      */
  VFN_REQUESTED: 'VFN_REQUESTED',
  /*
          Waiting for user to enter otp
      */
  VFN_WAITING_FOR_INPUT: 'VFN_WAITING_FOR_INPUT',
  /*
          User has submitted the otp
      */
  VFN_SUBMITTED: 'VFN_SUBMITTED',
  /*
          Answer has been verified successfully.
      */
  VFN_SUCCESS: 'VFN_SUCCESS',
  /*
      Answer was not verified successfully (could be error, or incorrect input)
    */
  VFN_ERROR: 'VFN_ERROR',
}

const DISPLAY = {
  VFN_DEFAULT: {
    verifyBtn: {
      hidden: false,
      loading: false,
      disabled: false,
    },
    section: {
      hidden: true,
    },
    tick: {
      hidden: true,
    },
    otpInput: {
      disabled: true,
    },
    otpSubmitBtn: {
      loading: false,
      disabled: true,
    },
    resendBtn: {
      disabled: true,
    },
  },
  VFN_REQUESTED: {
    verifyBtn: {
      hidden: false,
      loading: true,
      disabled: true,
    },
    section: {
      hidden: true,
    },
    tick: {
      hidden: true,
    },
    otpInput: {
      disabled: false,
    },
    otpSubmitBtn: {
      loading: false,
      disabled: true,
    },
    resendBtn: {
      disabled: true,
    },
  },
  VFN_WAITING_FOR_INPUT: {
    verifyBtn: {
      hidden: false,
      loading: false,
      disabled: true,
    },
    section: {
      hidden: false,
    },
    tick: {
      hidden: true,
    },
    otpInput: {
      disabled: false,
    },
    otpSubmitBtn: {
      loading: false,
      disabled: false,
    },
    resendBtn: {
      disabled: false,
    },
  },
  VFN_SUBMITTED: {
    verifyBtn: {
      hidden: false,
      disabled: true,
    },
    section: {
      hidden: false,
    },
    tick: {
      hidden: true,
    },
    otpInput: {
      disabled: true,
    },
    otpSubmitBtn: {
      loading: true,
      disabled: true,
    },
    resendBtn: {
      disabled: true,
    },
  },
  VFN_SUCCESS: {
    verifyBtn: {
      hidden: true,
      loading: false,
      disabled: true,
    },
    section: {
      hidden: true,
    },
    tick: {
      hidden: false,
    },
    otpInput: {
      disabled: true,
    },
    otpSubmitBtn: {
      loading: false,
      disabled: true,
    },
    resendBtn: {
      disabled: true,
    },
  },
  VFN_ERROR: {
    verifyBtn: {
      hidden: false,
      loading: false,
      disabled: true,
    },
    section: {
      hidden: false,
    },
    tick: {
      hidden: true,
    },
    otpInput: {
      disabled: false,
    },
    otpSubmitBtn: {
      loading: false,
      disabled: false,
    },
    resendBtn: {
      disabled: false,
    },
  },
}
