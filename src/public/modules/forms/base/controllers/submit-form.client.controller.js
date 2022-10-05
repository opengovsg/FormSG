'use strict'

const { getFormLogo } = require('../../helpers/logo')

angular
  .module('forms')
  .controller('SubmitFormController', [
    'FormData',
    'SpcpSession',
    '$window',
    '$location',
    '$cookies',
    '$document',
    'GTag',
    'Toastr',
    'prefill',
    SubmitFormController,
  ])

function SubmitFormController(
  FormData,
  SpcpSession,
  $window,
  $location,
  $cookies,
  $document,
  GTag,
  Toastr,
  prefill,
) {
  const vm = this
  const form = FormData.form

  // React migration checker - ONLY for plain form URLs (no suffixes like /template or /preview)
  if (/^\/[0-9a-fA-F]{24}\/?$/.test($location.path())) {
    const respondentCookie = $cookies.get(
      $window.reactMigrationRespondentCookieName,
    )

    if (respondentCookie === 'react') {
      $window.location.assign(`/${form._id}`)
      return
    }
  }

  // The form attribute of the FormData object contains the form fields, logic etc
  vm.myform = form

  const isSpcpSgidForm = !!['SP', 'CP', 'SGID'].includes(vm.myform.authType)
  const isMyInfoForm = !!(
    !FormData.isTemplate && vm.myform.authType === 'MyInfo'
  )
  const isUserLoggedIn = !!(
    FormData.spcpSession && FormData.spcpSession.userName
  )

  // Handle prefills
  // If it is an authenticated form, read the storedQuery from local storage and append to query params
  // As a design decision, regardless of whether user is logged in, we should replace the queryId with the
  // stored query params
  // queryId could exist even though user is not logged in if user initiates the login flow
  // but does not complete it and returns to the public form view within the same session

  if (isSpcpSgidForm || isMyInfoForm) {
    const location = $window.location.toString().split('?')
    if (location.length > 1) {
      const queryParams = new URLSearchParams(location[1])
      const queryId = queryParams.get(prefill.QUERY_ID)

      let storedQuery

      try {
        // If storedQuery is not valid JSON, JSON.parse throws a SyntaxError
        // In try-catch block as this should not prevent rest of form from being loaded
        storedQuery = JSON.parse(
          $window.sessionStorage.getItem(prefill.STORED_QUERY),
        )
      } catch (e) {
        console.error('Unable to parse storedQuery, not valid JSON string')
      }

      if (
        queryId &&
        storedQuery &&
        storedQuery._id === queryId &&
        storedQuery.queryString
      ) {
        $window.location.href = `${location[0]}?${storedQuery.queryString}` // Replace the queryId with stored queryString
        $window.sessionStorage.removeItem(prefill.STORED_QUERY) // Delete after reading the stored queryString, as only needed once
      }
    }
  }

  // For SP / CP / SGID forms, also include the spcpSession details
  // This allows the log out button to be correctly populated with the UID
  // Also provides time to cookie expiry so that client can refresh page
  if (isSpcpSgidForm && isUserLoggedIn) {
    SpcpSession.setUser(FormData.spcpSession)
  }

  // Set MyInfo login status
  if (isMyInfoForm) {
    if (isUserLoggedIn) {
      SpcpSession.setUserName(FormData.spcpSession.userName)
    } else {
      SpcpSession.clearUserName()
    }
  }

  vm.myform.isTemplate = Boolean(FormData.isTemplate)
  vm.myform.isPreview = Boolean(FormData.isPreview)
  vm.myInfoError = Boolean(FormData.myInfoError)
  if (
    FormData.isIntranetUser &&
    ['SP', 'CP', 'SGID', 'MyInfo'].includes(vm.myform.authType)
  ) {
    Toastr.permanentError(
      'SingPass/CorpPass login is not supported from WOG Intranet. Please use an Internet-enabled device to submit this form.',
    )
  }
  vm.logoUrl = getFormLogo(vm.myform)

  // Show banner content if available
  if ($window.siteBannerContent) {
    vm.banner = {
      msg: $window.siteBannerContent,
    }
  } else if ($window.isGeneralMaintenance) {
    // Show banner for SingPass forms
    vm.banner = {
      msg: $window.isGeneralMaintenance,
    }
  } else if (vm.myform.authType === 'SP' && $window.isSPMaintenance) {
    vm.banner = {
      msg: $window.isSPMaintenance,
    }
  } else if (vm.myform.authType === 'CP' && $window.isCPMaintenance) {
    vm.banner = {
      msg: $window.isCPMaintenance,
    }
  } else if (vm.myform.authType === 'MyInfo' && $window.myInfoBannerContent) {
    vm.banner = {
      msg: $window.myInfoBannerContent,
    }
  } else {
    vm.banner = {}
  }

  angular.element($document[0]).on('touchstart', function (e) {
    let activeElement = angular.element($document[0].activeElement)[0]
    if (!isTextInput(e.target) && isTextInput(activeElement)) {
      activeElement.blur()
    }
  })

  if (vm.myInfoError) {
    vm.myform.lockFields()
  }

  // Google Analytics
  GTag.visitPublicForm(vm.myform)

  /**
   * Dismiss keyboard on clicking outside.
   * @param  {Object} node - HTML document node
   * @return {Boolean} bool - Checks if HTML document node is a text input node
   */
  const isTextInput = (node) => {
    return ['INPUT', 'TEXTAREA'].indexOf(node.nodeName) !== -1
  }
}
