'use strict'

angular
  .module('forms')
  .service('captchaService', [
    '$window',
    'vcRecaptchaService',
    'Toastr',
    'GTag',
    captchaService,
  ])

function captchaService($window, vcRecaptchaService, Toastr, GTag) {
  /**
   * Captcha public key associated with app
   */
  this.publicKey = $window.captchaPublicKey

  /**
   * Captcha response if captcha answered successfully
   */
  this.response = null

  /**
   * Widget Id of captcha on this particular client
   */
  this.widgetId = null

  /**
   * Set widgetId
   * @param {String} widgetId
   */
  this.setWidget = function (widgetId) {
    this.widgetId = widgetId
    // With multiple captchas on the page, you will need to pass the widgetId
    // of the captcha you want to reset to the reload method.
    // Multiple captchas may occur if the formId after the hash is replaced
    // without reloading the page
    vcRecaptchaService.reload(this.widgetId)
  }

  /**
   * Set response and call success callback function
   * @param {String} response
   * @param {Function} cb
   */
  this.onSuccess = function (response, cb) {
    this.response = response
    cb()
  }

  /**
   * Show error toast and log error with Google Analytics
   * @param {*} form the form this error occurred for
   */
  this.onError = function (form) {
    Toastr.error(
      'Error: Cannot connect to reCAPTCHA. Please check your internet connectivity or try submitting on another device.',
    )
    GTag.reCaptchaOnError(form)
  }

  /**
   * Expire captcha
   */
  this.expire = function () {
    vcRecaptchaService.reload(this.widgetId)
    this.response = null
  }

  /**
   * Check if response has been set
   */
  this.isValid = function () {
    if (this.response) {
      return true
    } else {
      return false
    }
  }

  /**
   * Manually execute CAPTCHA verification.
   */
  this.challenge = function () {
    try {
      vcRecaptchaService.execute(this.widgetId)
    } catch (err) {
      // If https://www.google.com/recaptcha/api.js?onload=vcRecaptchaApiLoaded&render=explicit
      // could not loaded. vcRecaptchaService throws an error.
      Toastr.error(
        'Please ensure you have internet connectivity for CAPTCHA to load on this form.',
      )
    }
  }
}
