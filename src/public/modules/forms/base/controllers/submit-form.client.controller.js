'use strict'

const { getFormLogo } = require('../../helpers/logo')

angular
  .module('forms')
  .controller('SubmitFormController', [
    'FormData',
    'SpcpSession',
    '$window',
    '$document',
    'GTag',
    'Toastr',
    SubmitFormController,
  ])

function SubmitFormController(
  FormData,
  SpcpSession,
  $window,
  $document,
  GTag,
  Toastr,
) {
  const vm = this

  // The form attribute of the FormData object contains the form fields, logic etc
  vm.myform = FormData.form

  // For SP / CP forms, also include the spcpSession details
  // This allows the log out button to be correctly populated with the UID
  // Also provides time to cookie expiry so that client can refresh page
  if (
    ['SP', 'CP', 'SGID'].includes(vm.myform.authType) &&
    FormData.spcpSession &&
    FormData.spcpSession.userName
  ) {
    SpcpSession.setUser(FormData.spcpSession)
  }

  // Set MyInfo login status
  if (!FormData.isTemplate && vm.myform.authType === 'MyInfo') {
    if (FormData.spcpSession && FormData.spcpSession.userName) {
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
