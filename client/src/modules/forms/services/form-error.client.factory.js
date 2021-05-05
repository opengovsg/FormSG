// Forms service used to redirect users to the error page, based on the response received

const HttpStatus = require('http-status-codes')

angular
  .module('forms')
  .factory('FormErrorService', ['$state', FormErrorService])

function FormErrorService($state) {
  return {
    /**
     * Take an error response, and redirect the user to the error page with the relevant error message, or to sign in.
     * If the response error code is anything other than 401, the user is redirected to the error page.
     * If the error code is 401 and targetState is provided, the user is redirected to the login page instead,
     * after which they are sent back to the page they initially intended to visit.
     * @param {object} response - The response object
     * @param {number} [response.status] - The status code of the error
     * @param {string} [response.data.message] - The error message to be shown on the error page
     * @param {boolean} [response.data.isPageFound] - If a page was actually found, but returned a 404.
     * @param {string} [response.data.formTitle] - The title of the form that triggered the error
     * @param {string} [targetState] - If this redirect was called due to the user not being logged in (401 error),
     *                                 pass this as the targetState to the sign-in page's controller
     * @param {string} targetFormId - The formId of the form which gave rise to this error. If the target
     *                                state requires a formId, this should be provided
     */
    redirect: function ({ response, targetState, targetFormId }) {
      // Attempt to login to resolve the authentication error, if there was a targetState provided
      if (response.status === HttpStatus.UNAUTHORIZED && targetState) {
        return $state.go(
          'signin',
          { targetState, targetFormId },
          { location: 'replace' },
        )
      }

      return $state.go(
        'error',
        response.data
          ? {
              errorType: response.status,
              errorMessage: response.data.message,
              isPageFound: response.data.isPageFound,
              targetFormId,
              targetFormTitle: response.data.formTitle,
            }
          : null,
        { location: 'replace' },
      )
    },
  }
}
