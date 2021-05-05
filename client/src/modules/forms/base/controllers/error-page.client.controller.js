'use strict'

const HttpStatus = require('http-status-codes')

angular
  .module('forms')
  .controller('ErrorPageController', ['$transition$', ErrorPageController])

function ErrorPageController($transition$) {
  const vm = this

  const params = $transition$.params()

  // Display the error message provided
  vm.errorMessage = params.errorMessage

  // Display the form id that led to this page
  vm.formId = params.targetFormId

  if (params.errorType === String(HttpStatus.NOT_FOUND) && params.isPageFound) {
    // For custom messages, the custom message provided is sub-text
    vm.errorMessage = `"${params.targetFormTitle}" is not available.`
    vm.subText = params.errorMessage
  } else if (params.errorType === String(HttpStatus.NOT_FOUND)) {
    vm.subText = 'Please check your link again.'
  } else if (
    params.errorType === String(HttpStatus.UNAUTHORIZED) ||
    params.errorType === String(HttpStatus.FORBIDDEN)
  ) {
    vm.subText = 'Authorization is required to access this page.'
  } else {
    vm.subText =
      'If you think this is a mistake, please contact the agency that gave you the form link.'
  }
}
