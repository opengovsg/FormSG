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
   * Flag indicating if captcha feature is enabled on app
   */
  this.enabled = false

  /**
   * Set enabled flag
   * @param {Boolean} enabled
   */
  this.create = function (enabled) {
    // We cannot use setWidget() as an indication that captcha is enabled/disabled because setWidget() will not be called
    // when captcha is enabled but captcha is blocked
    this.enabled = enabled
    return this.enabled
  }

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

  this.onError = function () {
    Toastr.error(
      'Error: Cannot connect to reCAPTCHA. Please check your internet connectivity or try submitting on another device.',
    )
    GTag.reCaptchaOnError()
  }

  /**
   * Expire captcha if captcha enabled
   */
  this.expire = function () {
    if (this.enabled) {
      vcRecaptchaService.reload(this.widgetId)
      this.response = null
    }
  }

  /**
   * Check if response has been set, assuming captcha is enabled
   */
  this.isValid = function () {
    if (this.response || !this.enabled) {
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
