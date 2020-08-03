'use strict'
const { getFormLogo } = require('../../helpers/logo')

angular
  .module('forms')
  .controller('CreateFormTemplateModalController', [
    '$uibModalInstance',
    'GTag',
    'externalScope',
    CreateFormTemplateModalController,
  ])

function CreateFormTemplateModalController(
  $uibModalInstance,
  GTag,
  externalScope,
) {
  const vm = this
  vm.myform = externalScope.form
  vm.logoUrl = getFormLogo(vm.myform)

  // Handle modal close click
  vm.closeTemplateModal = function () {
    $uibModalInstance.close('cancel')
    GTag.covid19ClickCloseTemplate(vm.myform)
  }

  // Disable submit button on preview
  vm.isSubmitButtonDisabled = function () {
    return true
  }

  /**
   * Handle 'USE TEMPLATE' button click and
   * invoke the callback passed by the externalScope
   */
  vm.useTemplate = function () {
    $uibModalInstance.close('cancel')
    externalScope.useTemplate(externalScope.form)
  }
}
