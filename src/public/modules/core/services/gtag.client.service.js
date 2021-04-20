angular.module('core').factory('GTag', ['Auth', '$rootScope', '$window', GTag])

function GTag(Auth, $rootScope, $window) {
  // Google Analytics tracking ID provided on signup.
  const GATrackingID = $window.GATrackingID
  let gtagService = {}

  const getUserEmail = () => {
    const user = Auth.getUser()
    return user && user.email
  }

  /**
   * Internal wrapper function to initialise GA with some globals
   *
   * @return {Void}
   */
  const _gtagSetup = () => {
    if (GATrackingID) {
      $window.gtag('config', GATrackingID, {
        custom_map: {
          dimension1: 'form_id',
          dimension2: 'message',
          metric1: 'duration',
          metric2: 'num_workers',
          metric3: 'num_submissions',
          metric4: 'err_count',
        },
      })
    }
  }

  /**
   * Internal wrapper function for event tracking.
   * Does not fire if GA Tracking ID is not provided.
   * A list of default event names and parameters may be found here:
   * https://developers.google.com/gtagjs/reference/event
   * @param  {String} eventName   Name of the event to track.
   * @param  {Object} eventParams Event parameters to track.
   * @return {Void}
   */
  const _gtagEvents = (eventName, eventParams) => {
    if (GATrackingID) {
      $window.gtag('event', eventName, eventParams)
    }
  }

  /**
   * Internal wrapper function to track page views by setting the gtag.js
   * configuration. Does not fire if GA Tracking ID is not provided.
   *
   * @param  {String} [pageTitle] The page's title.
   * @param  {String} [pagePath] The page's URL.
   * @param  {String} [pageLocation] The path portion of `location`. Must
   * start with a slash (/) character.
   * @return {Void}
   */
  const _gtagPageview = ({ pageTitle, pagePath, pageLocation }) => {
    if (GATrackingID) {
      $window.gtag('config', GATrackingID, {
        page_title: pageTitle,
        page_path: pagePath,
        page_location: pageLocation,
      })
    }
  }

  // Register custom dimensions and metrics
  _gtagSetup()

  // Track pageviews by binding to UI-Router
  $rootScope.$on('$stateChangeSuccess', ($event, $toState) => {
    _gtagPageview({
      pageTitle: $toState.name,
      pageLocation: $toState.templateUrl,
      pagePath: $toState.url,
    })
  })

  /**
   * Logs an admin user's success on login
   * @param  {String} loginMethod Login method e.g. 'otp'
   * @return {Void}
   */
  gtagService.loginSuccess = (loginMethod) => {
    if (loginMethod) {
      _gtagEvents('login', {
        event_category: 'Login',
        event_action: loginMethod + ' Login Successful',
        method: loginMethod,
      })
    }
  }

  /**
   * Logs an admin user's failure to login
   * @param  {String} loginMethod Login method e.g. 'otp'
   * @return {Void}
   */
  gtagService.loginFailure = (loginMethod, message) => {
    if (loginMethod) {
      let eventParams = {
        event_category: 'Login',
        event_action: loginMethod + ' Login Failure',
        method: loginMethod,
      }
      if (message) eventParams.message = message
      _gtagEvents('login', eventParams)
    }
  }

  /**
   * Logs an admin user's failure to create form
   * @param  {Object} form The form object
   * @return {Void}
   */
  gtagService.createFormFailed = () => {
    _gtagEvents('create_form', {
      event_category: 'Create Form',
      event_action: 'Create Form failed',
      event_label: getUserEmail(),
    })
  }

  /**
   * Logs an admin user landing on the Examples tab.
   * @return {Void}
   */
  gtagService.examplesVisitPage = () => {
    _gtagEvents('search', {
      event_category: 'Examples',
      event_action: 'Visit Examples',
    })
  }

  /**
   * Logs an admin user's search term from the search bar on the Examples tab.
   * @return {Void}
   */
  gtagService.examplesSearchTerm = (searchTerm) => {
    if (searchTerm) {
      _gtagEvents('search', {
        search_term: searchTerm,
        event_category: 'Examples',
        event_action: 'Search Examples',
        event_label: searchTerm,
      })
    }
  }

  /**
   * Logs an admin user's click upon selecting a form on the Examples tab.
   * @param  {Object} form The form object
   * @return {Void}
   */
  gtagService.examplesClickOpenTemplate = (form) => {
    _gtagEvents('search', {
      event_category: 'Examples',
      event_action: 'Click Open Template',
      event_label: `${form.title} (${form._id})`,
      form_id: form._id,
    })
  }

  /**
   * Logs an admin user's click to close a form template on the Examples modal
   * after selecting a form.
   * @param  {Object} form The form object
   * @return {Void}
   */
  gtagService.examplesClickCloseTemplate = (form) => {
    _gtagEvents('search', {
      event_category: 'Examples',
      event_action: 'Click Close Template',
      event_label: `${form.title} (${form._id})`,
      form_id: form._id,
    })
  }

  /**
   * Logs an admin user's click to create a form from the Examples modal.
   * @param  {Object} form The form object
   * @return {Void}
   */
  gtagService.examplesClickCreateNewForm = (form) => {
    _gtagEvents('search', {
      event_category: 'Examples',
      event_action: 'Click Create New Form',
      event_label: `${form.title} (${form._id})`,
      form_id: form._id,
    })
  }

  /**
   * Logs an admin user's click to create a form from scratch
   * @param  {Object} form The form object
   * @return {Void}
   */
  gtagService.covid19ClickCreateFromScratch = () => {
    _gtagEvents('create_template', {
      event_category: 'COVID19 Template',
      event_action: 'Click Create From Scratch',
    })
  }

  /**
   * Logs an admin user's click upon selecting a COVID19 template
   * @param  {Object} form The form object
   * @return {Void}
   */
  gtagService.covid19ClickOpenTemplate = (template) => {
    _gtagEvents('create_template', {
      event_category: 'COVID19 Template',
      event_action: 'Click Open Template',
      event_label: template.title,
    })
  }

  /**
   * Logs an admin user's click to close a COVID19 template preview
   * @param  {Object} form The form object
   * @return {Void}
   */
  gtagService.covid19ClickCloseTemplate = (template) => {
    _gtagEvents('create_template', {
      event_category: 'COVID19 Template',
      event_action: 'Click Close Template',
      event_label: template.title,
    })
  }

  /**
   * Logs an admin user's click to create a form from COVID19 template modal.
   * @param  {Object} form The form object
   * @return {Void}
   */
  gtagService.covid19ClickUseTemplate = (template) => {
    _gtagEvents('create_template', {
      event_category: 'COVID19 Template',
      event_action: 'Click Use Template',
      event_label: template.title,
    })
  }

  /**
   * Internal wrapper function for logging Public Form events
   * @param       {Object} form        The form object
   * @param       {String} eventAction The Google Analytics event_action
   * @param       {[Date]} startDate   An optional start date to track duration
   * @param       {[Date]} endDate     An optional end date to track duration
   * @param       {String} message     An optional message for the event
   * @constructor
   * @return      {Void}
   */
  function _gtagPublicFormEvents(
    form,
    eventAction,
    startDate,
    endDate,
    message,
  ) {
    let eventParams = {
      event_category: 'Public Form',
      event_action: eventAction,
      event_label: `${form.title} (${form._id})`,
      form_id: form._id,
    }

    if (startDate && endDate && endDate > startDate) {
      eventParams.duration = (endDate - startDate) / 1000 // seconds
    }

    if (message) {
      eventParams.message = message
    }

    _gtagEvents('public_form', eventParams)
  }

  /**
   * Logs a visit to a published form
   * @param  {Object} form The form object
   * @return {Void}
   */
  gtagService.visitPublicForm = (form) => {
    if (!form.isPreview && form.status === 'PUBLIC') {
      _gtagPublicFormEvents(form, 'Visit Public Form')
    }
  }

  /**
   * Logs a successful public form submission
   * @param  {Object} form The form object
   * @param  {Date} startDate The start date
   * @param  {Date} endDate The end date
   * @return {Void}
   */
  gtagService.submitFormSuccess = (form, startDate, endDate) => {
    if (!form.isPreview && form.status === 'PUBLIC') {
      _gtagPublicFormEvents(
        form,
        'Submit Public Form Success',
        startDate,
        endDate,
      )
    }
  }

  /**
   * Logs a failed public form submission
   * @param  {Object} form The form object
   * @param  {Date} startDate The start date
   * @param  {Date} endDate The end date
   * @return {Void}
   */
  gtagService.submitFormFailure = (form, startDate, endDate, message) => {
    if (!form.isPreview && form.status === 'PUBLIC') {
      _gtagPublicFormEvents(
        form,
        'Submit Public Form Failure',
        startDate,
        endDate,
        message,
      )
    }
  }

  /**
   * Logs a form-filler's use of the persistent login feature
   * @param {Object} form The form object
   * @return {Void}
   */
  gtagService.persistentLoginUse = (form) => {
    if (!form.isPreview && form.status === 'PUBLIC') {
      _gtagEvents('public_form', {
        event_category: 'Public Form',
        event_action: 'Persistent Login',
      })
    }
  }

  /**
   * Logs a successful public form submission where persistent session was used
   * @param  {Object} form The form object
   * @param  {Date} start Time since persistent login.
   * @param  {Date} endDate Time of successful form submission.
   * @return {Void}
   */
  gtagService.formSubmitWithPersistentSession = (form, start, end) => {
    if (!form.isPreview && form.status === 'PUBLIC') {
      _gtagPublicFormEvents(
        form,
        'Submit Public Form with Persistent Session',
        start,
        end,
      )
    }
  }

  /**
   * Logs the start of a storage mode responses download.
   * @param {Object} params The response params object
   * @param {String} params.formId ID of the form
   * @param {String} params.formTitle The title of the form
   * @param {number} expectedNumSubmissions The expected number of submissions to download
   * @param {number} numWorkers The number of decryption workers
   * @return {Void}
   */
  gtagService.downloadResponseStart = (
    params,
    expectedNumSubmissions,
    numWorkers,
  ) => {
    _gtagEvents('storage', {
      event_category: 'Storage Mode Form',
      event_action: 'Download start',
      event_label: `${params.formTitle} (${params.formId}), ${getUserEmail()}`,
      form_id: params.formId,
      num_workers: numWorkers,
      num_submissions: expectedNumSubmissions,
    })
  }

  /**
   * Logs a successful storage mode responses download.
   * @param {Object} params The response params object
   * @param {String} params.formId ID of the form
   * @param {String} params.formTitle The title of the form
   * @param {number} downloadedNumSubmissions The number of submissions downloaded
   * @param {number} numWorkers The number of decryption workers
   * @param {number} duration The duration taken by the download
   * @return {Void}
   */
  gtagService.downloadResponseSuccess = (
    params,
    downloadedNumSubmissions,
    numWorkers,
    duration,
  ) => {
    _gtagEvents('storage', {
      event_category: 'Storage Mode Form',
      event_action: 'Download success',
      event_label: `${params.formTitle} (${params.formId}), ${getUserEmail()}`,
      form_id: params.formId,
      duration: duration,
      num_workers: numWorkers,
      num_submissions: downloadedNumSubmissions,
    })
  }

  /**
   * Logs a failed storage mode responses download.
   * @param {Object} params The response params object
   * @param {String} params.formId ID of the form
   * @param {String} params.formTitle The title of the form
   * @param {number} numWorkers The number of decryption workers
   * @param {number} expectedNumSubmissions The expected number of submissions
   * @param  {number} duration The duration taken by the download
   * @param {string} errorMessage The error message for the failure
   * @return {Void}
   */
  gtagService.downloadResponseFailure = (
    params,
    numWorkers,
    expectedNumSubmissions,
    duration,
    errorMessage,
  ) => {
    _gtagEvents('storage', {
      event_category: 'Storage Mode Form',
      event_action: 'Download failure',
      event_label: `${params.formTitle} (${params.formId}), ${getUserEmail()}`,
      form_id: params.formId,
      duration: duration,
      num_workers: numWorkers,
      num_submissions: expectedNumSubmissions,
      message: errorMessage,
    })
  }

  /**
   * Logs a failed attempt to even start storage mode responses download.
   * @param {Object} params The response params object
   * @param {String} params.formId ID of the form
   * @param {String} params.formTitle The title of the form
   * @param {string} errorMessage The error message for the failure
   * @return {Void}
   */
  gtagService.downloadNetworkFailure = (params, errorMessage) => {
    _gtagEvents('storage', {
      event_category: 'Storage Mode Form',
      event_action: 'Network failure',
      event_label: `${params.formTitle} (${params.formId}), ${getUserEmail()}`,
      form_id: params.formId,
      message: errorMessage,
    })
  }

  /**
   * Logs partial (or full) decryption failure when downloading responses.
   * @param {Object} params The response params object
   * @param {String} params.formId ID of the form
   * @param {String} params.formTitle The title of the form
   * @param {number} numWorkers The number of decryption workers
   * @param {number} expectedNumSubmissions The expected number of submissions
   * @param {number} errorCount The number of submissions that failed to decrypt
   * @param {number} attachmentErrorCount The number of submissions attachments that failed to download (if any were requested)
   * @param  {number} duration The duration taken by the download
   * @return {Void}
   */
  gtagService.partialDecryptionFailure = (
    params,
    numWorkers,
    expectedNumSubmissions,
    errorCount,
    attachmentErrorCount,
    duration,
  ) => {
    _gtagEvents('storage', {
      event_category: 'Storage Mode Form',
      event_action: 'Partial decrypt error',
      event_label: `${params.formTitle} (${params.formId}), ${getUserEmail()}`,
      form_id: params.formId,
      duration: duration,
      num_workers: numWorkers,
      num_submissions: expectedNumSubmissions,
      err_count: errorCount,
      attachment_err_count: attachmentErrorCount,
    })
  }

  /**
   * Logs clicking on mailto link to share form secret key with collaborators.
   */
  gtagService.clickSecretKeyMailto = (formTitle) => {
    _gtagEvents('storage', {
      event_category: 'Storage Mode Form',
      event_action: 'Secret key mailto clicked',
      event_label: formTitle,
    })
  }

  /**
   * Logs client form reCAPTCHA onError.
   */
  gtagService.reCaptchaOnError = () => {
    _gtagEvents('recaptcha', {
      event_category: 'Client Form reCAPTCHA',
      event_action: 'reCAPTCHA connection failure',
    })
  }

  return gtagService
}
