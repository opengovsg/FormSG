'use strict'
const cloneDeep = require('lodash/cloneDeep')
const get = require('lodash/get')
const cuid = require('cuid')
const { default: format } = require('date-fns/format')

const FieldVerificationService = require('../../../../services/FieldVerificationService')
const PublicFormAuthService = require('../../../../services/PublicFormAuthService')
const PublicFormService = require('../../../../services/PublicFormService')
const UpdateFormService = require('../../../../services/UpdateFormService')
const {
  getVisibleFieldIds,
  getLogicUnitPreventingSubmit,
} = require('../../../../../shared/util/logic')

/**
 * @typedef {number} FormState
 */
/**
 * @enum {FormState}
 */
const FORM_STATES = {
  DEFAULT: 0,
  SUBMITTING: 1,
  SUBMITTED: 2,
  SUBMISSION_ERROR: 3,
  SUBMIT_PREVENTED: 4,
}

angular
  .module('forms')
  .directive('submitFormDirective', [
    '$q',
    '$window',
    'GTag',
    'SpcpSession',
    'captchaService',
    'responseModeEnum',
    'Toastr',
    '$filter',
    'Submissions',
    '$uibModal',
    '$timeout',
    '$location',
    'prefill',
    submitFormDirective,
  ])

function submitFormDirective(
  $q,
  $window,
  GTag,
  SpcpSession,
  captchaService,
  responseModeEnum,
  Toastr,
  $filter,
  Submissions,
  $uibModal,
  $timeout,
  $location,
  prefill,
) {
  return {
    restrict: 'E',
    templateUrl:
      'modules/forms/base/directiveViews/submit-form.directive.view.html',
    scope: {
      form: '=',
      logoUrl: '<',
      myInfoError: '<',
      disableSubmitButton: '<',
    },
    link: function (scope, _element, _attrs, _ctrl) {
      const startDate = Date.now() // Used to calculate time spent on form
      scope.captchaService = captchaService
      scope.SpcpSession = SpcpSession

      // Necessary to pass scope.forms.myForm to field directives
      scope.forms = {}

      scope.uiState = {
        submitButtonClicked: false,
        savedForm: null,
        formSubmitted: false,
        progressModal: null,
        submitPrevented: false,
        submitPreventedMessage: '',
      }

      // Also used to store a backup of the form state during submission, the state
      // of the progress modal
      scope.controllerState = {}

      const setReferrerToNull = () => {
        const meta = document.createElement('meta')
        meta.setAttribute('name', 'referrer')
        meta.setAttribute('content', 'no-referrer')
        meta.style.display = 'none'
        $('head').append(meta)
      }

      scope.formLogin = function (isPersistentLogin) {
        // Fire GA tracking event
        if (isPersistentLogin) GTag.persistentLoginUse(scope.form)

        const query = $location.url().split('?')
        const queryString = query.length > 1 ? query[1] : undefined
        const queryId = queryString ? cuid() : undefined
        const encodedQuery = queryId
          ? btoa(`${prefill.QUERY_ID}=${queryId}`)
          : undefined
        const queryObject = {
          _id: queryId,
          queryString,
        }

        if (queryString) {
          // Defensive - try catch block in case the storage is full
          // See https://developer.mozilla.org/en-US/docs/Web/API/Storage/setItem
          try {
            // We use storedQuery as the sessionStorage key rather than just using the queryId
            // because only one person can be logging in at a time in a given session, so
            // we should only store one set of prefill params. Meanwhile, we use queryId and pass it to the
            // backend instead of simply storing the query params directly in sessionStorage, so as to
            // ensure that the stored query is loaded only for the session where it was generated
            sessionStorage.setItem(
              prefill.STORED_QUERY,
              JSON.stringify(queryObject),
            )
          } catch (e) {
            console.error('Failed to store query string')
            // Login can proceed, since after login, user can still prefill form by accessing
            // url with query params
          }
        }

        return $q
          .when(
            PublicFormAuthService.createRedirectURL(
              scope.form._id,
              isPersistentLogin,
              encodedQuery,
            ),
          )
          .then((response) => {
            setReferrerToNull()
            $window.location.href = response.redirectURL
          })
          .catch((error) => {
            console.error(error)
            Toastr.error(
              'Sorry, there was a problem with your login. Please try again.',
            )
          })
      }

      /*
       ** Private function that shows all invalid fields and fade in
       *  error message if Submit is pressed.
       */
      function displayInvalidSubmit() {
        Toastr.error(
          'Sorry, your submission has errors. Correct them and submit again.',
        )
        // Display error messages of all fields
        let invalidElements = angular.element('.field-input .ng-invalid')
        // force all the "Please fill in required field" message to appear by touching all fields
        for (let i = 0; i < invalidElements.length; i++) {
          if (
            !invalidElements[i].id ||
            !scope.forms.myForm[invalidElements[i].id]
          ) {
            continue
          }
          scope.forms.myForm[invalidElements[i].id].$setTouched()
        }
      }

      const isAnyFieldInvalid = () => {
        // Check the validity of each individual field. We do this due to
        // a possible bug in WebKit where form submission may not be correctly
        // prevented when the form is invalid.
        return (
          scope.forms.myForm.$invalid ||
          scope.form.form_fields.some(
            ({ _id }) =>
              scope.forms.myForm[_id] && scope.forms.myForm[_id].$invalid,
          )
        )
      }

      scope.checkCaptchaAndSubmit = () => {
        if (isAnyFieldInvalid()) {
          displayInvalidSubmit()
          return
        }

        // Manually retry captcha if captcha not set yet
        // unless in preview mode.
        // or captcha feature not enabled
        if (
          scope.form.hasCaptcha &&
          !scope.form.isPreview &&
          !captchaService.isValid()
        ) {
          captchaService.challenge() // captcha service will call submitForm on success
          return
        } else {
          scope.submitForm()
        }
      }

      function advanceLogic() {
        const visibleFieldIds = getVisibleFieldIds(
          scope.form.form_fields,
          scope.form,
        )
        scope.form.form_fields.forEach(function (field) {
          const fieldWasVisibleBeforeUpdate = field.isVisible
          field.isVisible = visibleFieldIds.has(field._id)
          // If the field goes from shown to hidden, then clear its contents
          if (fieldWasVisibleBeforeUpdate && !field.isVisible) {
            field.clear(false)
          }
        })
        const preventSubmitLogicUnit = getLogicUnitPreventingSubmit(
          scope.form.form_fields,
          scope.form,
          visibleFieldIds,
        )
        setPreventSubmitState(preventSubmitLogicUnit)
      }

      /**
       * Sets the form state based on a logic unit that prevents submission.
       * @param {Object} preventSubmitLogicUnit Return value of getLogicUnitPreventingSubmit
       */
      function setPreventSubmitState(preventSubmitLogicUnit) {
        // Edge case: advanceLogic is also called when the user has just clicked submit,
        // in which case we shouldn't set the form state back to default. This relies on
        // the event loop to set scope.uiState.submitButtonClicked = true before calling
        // advanceLogic.
        if (preventSubmitLogicUnit) {
          setFormState(
            FORM_STATES.SUBMIT_PREVENTED,
            preventSubmitLogicUnit.preventSubmitMessage,
          )
        } else if (!scope.uiState.submitButtonClicked) {
          setFormState(FORM_STATES.DEFAULT)
        }
      }

      const setFormState = (state, preventSubmitMessage) => {
        switch (state) {
          case FORM_STATES.DEFAULT:
            closeProgressModal()
            scope.uiState.submitButtonClicked = false
            // This check is necessary to prevent clearing of submission error Toast
            if (scope.uiState.submitPrevented) {
              scope.uiState.submitPrevented = false
              scope.uiState.submitPreventedMessage = ''
            }
            break
          case FORM_STATES.SUBMITTING:
            scope.controllerState.savedForm = cloneDeep(scope.form)
            scope.form.lockFields()
            scope.uiState.submitButtonClicked = true
            if (scope.form.hasAttachments()) {
              openProgressModal()
            }
            break
          case FORM_STATES.SUBMITTED:
            if (scope.form.hasAttachments()) {
              $timeout(() => {
                closeProgressModal()
                scope.uiState.formSubmitted = true
                $window.scrollTo(0, 0)
              }, 1500)
            } else {
              scope.uiState.formSubmitted = true
              $window.scrollTo(0, 0)
            }
            break
          case FORM_STATES.SUBMISSION_ERROR:
            scope.form = scope.controllerState.savedForm
            setFormState(FORM_STATES.DEFAULT)
            break
          case FORM_STATES.SUBMIT_PREVENTED:
            if (!preventSubmitMessage) {
              preventSubmitMessage =
                'The form admin has disabled submission for forms with these answers.'
            }
            scope.uiState.submitPreventedMessage = preventSubmitMessage
            scope.uiState.submitPrevented = true
            break
          default:
            throw new Error('setFormState called with invalid input.')
        }
      }

      /**
       * Opens the submission progress modal.
       */
      const openProgressModal = function () {
        scope.controllerState.progressModal = $uibModal.open({
          animation: true,
          backdrop: 'static',
          keyboard: false,
          templateUrl:
            'modules/forms/base/views/submit-progress.client.modal.html',
          windowClass: 'submit-progress-modal-window',
        })
      }

      /**
       * Closes the submission progress modal if it is currently open.
       */
      const closeProgressModal = () => {
        if (scope.controllerState.progressModal) {
          scope.controllerState.progressModal.close()
          scope.controllerState.progressModal = null
        }
      }

      /**
       * Listener for submit button. Wraps main submission flow to catch
       * and handle any errors.
       */
      scope.submitForm = () => {
        try {
          submitFormMain(scope.form)
        } catch (error) {
          handleSubmitFailure(error, 'Please try again later.')
        }
      }

      /**
       * Processes and submits form to backend.
       * @param {Object} form Copy of form to submit
       */
      const submitFormMain = async (form) => {
        // Disable UI and optionally open progress modal while processing
        setFormState(FORM_STATES.SUBMITTING)

        // submissionContent is the POST body to backend when we submit the form
        let submissionContent

        try {
          submissionContent = await form.getSubmissionContent()
        } catch (err) {
          return handleSubmitFailure(
            err,
            'There was an error while processing your submission. Please refresh and try again. ' +
              'If the problem persists, try using a different browser.',
          )
        }

        const captchaResponse = captchaService.response

        switch (form.responseMode) {
          case responseModeEnum.EMAIL: {
            const content = { responses: submissionContent.responses }

            const submitFn = form.isPreview
              ? UpdateFormService.submitEmailModeFormPreview
              : PublicFormService.submitEmailModeForm

            return $q
              .when(
                submitFn({
                  formId: scope.form._id,
                  content,
                  captchaResponse,
                  attachments: submissionContent.attachments,
                }),
              )
              .then(handleSubmitSuccess)
              .catch(handleSubmitFailure)
          }
          case responseModeEnum.ENCRYPT: {
            const submitFn = form.isPreview
              ? UpdateFormService.submitStorageModeFormPreview
              : PublicFormService.submitStorageModeForm

            return $q
              .when(
                submitFn({
                  formId: scope.form._id,
                  content: submissionContent,
                  captchaResponse,
                }),
              )
              .then(handleSubmitSuccess)
              .catch(handleSubmitFailure)
          }
          default:
            handleSubmitFailure(
              new Error(
                'Invalid response mode',
                'There was an error while processing your submission. Please refresh and try again. ' +
                  'If the problem persists, try using a different browser.',
              ),
            )
        }
      }

      /**
       * Helper function for Google Analytics to check for persistent login.
       */
      const shouldTrackPersistentLoginUse = () => {
        scope.form.authType === 'SP' && SpcpSession.isRememberMeSet()
      }
      /**
       * Returns a callback for form submission success, which updates UI
       * state and Google Analytics.
       */
      const handleSubmitSuccess = (response) => {
        scope.submissionId = response.submissionId
        scope.timestamp = format(
          new Date(response.timestamp),
          'dd MMM yyyy, HH:mm:ss z',
        )
        setFormState(FORM_STATES.SUBMITTED)
        GTag.submitFormSuccess(scope.form, startDate, Date.now())
        if (shouldTrackPersistentLoginUse()) {
          GTag.formSubmitWithPersistentSession(
            scope.form,
            SpcpSession.getIssuedAt(),
            Date.now(),
          )
        }
      }

      /**
       * Returns a callback for form submission failure, which updates UI
       * state and Google Analytics.
       * @param {Error} error the error object that caused the submission failure.
       * @param {string?} toastMessage The toast message to display, if any.
       */
      const handleSubmitFailure = (error, toastMessage) => {
        const form = scope.form
        const errorMessage = get(
          error,
          'response.data.message',
          get(
            error,
            'message',
            "Please refresh and try again. If this doesn't work, try switching devices or networks.",
          ),
        )

        console.error('Submission error:\t', error)
        setFormState(FORM_STATES.SUBMISSION_ERROR)
        if (!toastMessage) {
          toastMessage = errorMessage
        }
        Toastr.error(
          toastMessage,
          {
            timeOut: 5000,
            extendedTimeOut: 1000,
            closeButton: false,
          },
          'Submission Error',
        )
        GTag.submitFormFailure(form, startDate, Date.now(), error)
        if (get(error, 'response.data.spcpSubmissionFailure')) {
          SpcpSession.logout(form.authType)
        }

        // Expire captcha if form has captcha
        if (form.hasCaptcha) {
          captchaService.expire()
        }
      }

      scope.isSubmitButtonDisabled = () => {
        return (
          scope.uiState.submitPrevented ||
          (!scope.uiState.submitButtonClicked &&
            scope.form.isTemplate &&
            !scope.form.isPreview)
        )
      }
      // Monitor logic changes
      scope.$watch(
        function () {
          return JSON.stringify(scope.form.form_fields)
        },
        function (_newVal, _oldVal) {
          advanceLogic()
          // Update field numbers depending on what fields are shown
          scope.form.form_fields = $filter('addFieldNumber')(
            scope.form.form_fields,
          )
        },
        true,
      )

      // Create a transaction if there are fields to be verified and the form is intended for submission
      if (!scope.disableSubmitButton) {
        $q.resolve(
          FieldVerificationService.createTransactionForForm(scope.form._id),
        )
          .then((res) => {
            if (res.transactionId) {
              scope.transactionId = res.transactionId
            }
          })
          .catch((error) => {
            const statusCode = get(error, 'response.status')
            if (statusCode === 429) {
              const toastMessage =
                'You have requested this form too many times and fields that require verification will fail. Please try refreshing the form after one minute.'

              console.error('transactionId error:\t', error)
              Toastr.permanentError(toastMessage)
            }
          })
      }

      // Variable to indicate if there are prefill fields
      // Use scope.$watch to monitor logic changes
      scope.$watch(() => {
        scope.hasPrefill = scope.form.form_fields.some((field) => {
          return field.allowPrefill && field.isVisible && field.isPrefilled
        })
      })
    },
  }
}
