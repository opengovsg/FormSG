'use strict'
const { triggerFileDownload } = require('../../helpers/util')
const { templates } = require('../constants/covid19')
const Form = require('../../viewmodels/Form.class')
const { FormSgSdk } = require('../../../../services/FormSgSdkService')

/**
 * Determine the form title when duplicating a form
 * @param {string} title Intended form title
 * @param {Object} myforms List of forms
 */
function determineDuplicateFormTitle(title, myforms) {
  const titlePrefix = title + '_'
  // Only appends number when original form is copied, treats duplicates as originals too
  let copyIndex = 1
  // Only match forms titles with same prefix
  let formsWithTitlePrefix = _(myforms)
    .map('title')
    .filter((title) => title.startsWith(titlePrefix))
    .value()

  while (
    formsWithTitlePrefix.indexOf(titlePrefix + copyIndex.toString()) > -1
  ) {
    copyIndex++
  }
  return `${titlePrefix}${copyIndex}`
}

angular
  .module('forms')
  .controller('CreateFormModalController', [
    '$uibModalInstance',
    '$state',
    '$timeout',
    '$uibModal',
    'Toastr',
    'responseModeEnum',
    'createFormModalOptions',
    'FormToDuplicate',
    'FormApi',
    'FormFields',
    'GTag',
    'externalScope',
    'MailTo',
    '$q',
    CreateFormModalController,
  ])

function CreateFormModalController(
  $uibModalInstance,
  $state,
  $timeout,
  $uibModal,
  Toastr,
  responseModeEnum,
  createFormModalOptions,
  FormToDuplicate,
  FormApi,
  FormFields,
  GTag,
  externalScope,
  MailTo,
  $q,
) {
  const vm = this

  function getFormDataObject(mode, isEncryptModeEnabled, emails, title) {
    return {
      mode,
      // Defaults to encrypt instead of email if encrypt mode is enabled
      responseMode: isEncryptModeEnabled
        ? responseModeEnum.ENCRYPT
        : responseModeEnum.EMAIL,
      emails,
      isEncryptModeEnabled,
      title: title || '',
    }
  }

  // Whether this operation should allow Storage Mode forms
  const isEncryptModeEnabled =
    !FormFields.preventStorageModeDuplication(FormToDuplicate)

  const { mode } = createFormModalOptions
  vm.mode = mode

  let emails, title
  switch (mode) {
    case 'duplicate':
      emails = FormToDuplicate.emails || externalScope.user.email
      title = determineDuplicateFormTitle(
        FormToDuplicate.title,
        externalScope.myforms,
      )
      break
    case 'useTemplate':
      emails = externalScope.user.email
      title = 'Template_' + externalScope.form.title
      break
    case 'create': // Create Form
      emails = externalScope.user.email
      break
  }
  // For use with configure-form-directive
  vm.formData = getFormDataObject(mode, isEncryptModeEnabled, emails, title)

  // COVID-19 Templates
  vm.showCovid = mode == 'create'
  vm.templates = templates

  /**
   * Handle "Create From Scratch" button click
   * and proceed with original create flow
   */
  vm.handleStartFromScratch = function () {
    vm.showCovid = false
    GTag.covid19ClickCreateFromScratch()
  }

  /**
   * Callback for CreateFormTemplateModalController
   * to handle "USE TEMPLATE" button click
   *
   * @param {Object} template - form template selected
   */
  vm.handleUseCovidTemplate = function (template) {
    vm.showCovid = false
    vm.template = template
    vm.mode = 'createFromTemplate'
    GTag.covid19ClickUseTemplate(template)
  }

  /**
   * Handle template card click and proceed to
   * display form preview
   *
   * @param {Object} template - form template selected
   */
  vm.openTemplateModal = function (template) {
    const previewForm = new Form(
      Object.assign({}, template, { isTemplate: true }),
    )

    $uibModal.open({
      animation: false,
      templateUrl:
        'modules/forms/admin/views/create-form-template.client.modal.html',
      windowClass: 'create-form-template-modal-window',
      controller: 'CreateFormTemplateModalController',
      controllerAs: 'vm',
      resolve: {
        externalScope: () => ({
          user: externalScope.user,
          form: previewForm,
          useTemplate: vm.handleUseCovidTemplate,
        }),
      },
    })

    GTag.covid19ClickOpenTemplate(template)
  }

  /**
   * Returns the first sentence of the string
   *
   * @param {string} s - string to extract first sentence
   *
   * @returns {string} first sentence of the string, or the whole
   * string if the first sentence cannot be extracted.
   */
  vm.firstSentence = function (s) {
    const match = s.match(/^.*?[\.!\?](?:\s|$)/) // eslint-disable-line
    if (!match) {
      return s
    }
    return match[0]
  }

  // Status for response mode === responseModeEnum.ENCRYPT ,
  // 1 - Get Started, select response mode
  // 2 - Pending creation of private/public key
  // 3 - Display private key
  vm.formStatus = 1
  vm.publicKey = ''

  vm.hasSavedKey = false

  vm.closeCreateModal = function () {
    $uibModalInstance.close('cancel')
  }

  vm.goToWithId = function (route, id) {
    $state.go(route, { formId: id }, { reload: true })
  }

  vm.downloadFile = function () {
    if (vm.formStatus === 3 && vm.secretKey !== '') {
      const blob = new Blob([vm.secretKey], {
        type: 'text/plain;charset=utf-8',
      })
      const filename = `Form Secret Key - ${vm.formData.title}.txt`
      triggerFileDownload(blob, filename)
      vm.hasSavedKey = true
    } else {
      Toastr.error('Form password could not be downloaded')
    }
  }

  function handleCreateFormError(errorResponse) {
    if (errorResponse && errorResponse.data) {
      Toastr.error(errorResponse.data.message)
    }
    GTag.createFormFailed()

    vm.closeCreateModal()
  }

  vm.createNewForm = function () {
    if (
      vm.formStatus === 1 &&
      vm.formData.responseMode === responseModeEnum.ENCRYPT
    ) {
      vm.formStatus = 2
      const { publicKey, secretKey } = FormSgSdk.crypto.generate()
      vm.publicKey = publicKey
      vm.secretKey = secretKey
      MailTo.generateMailToUri(vm.formData.title, secretKey).then(
        (mailToUri) => {
          $timeout(() => {
            vm.mailToUri = mailToUri
            vm.formStatus = 3
          })
        },
      )
    } else if (
      (vm.formStatus === 1 &&
        vm.formData.responseMode === responseModeEnum.EMAIL) ||
      (vm.formStatus === 3 && vm.publicKey !== '')
    ) {
      if (vm.createForm.$valid) {
        vm.formStatus = 2
        delete vm.secretKey

        // Common parameters regardless of mode of form creation
        const formParams = {
          title: vm.formData.title,
          responseMode: vm.formData.responseMode,
          publicKey:
            vm.formData.responseMode === responseModeEnum.ENCRYPT
              ? vm.publicKey
              : '',
          emails: vm.formData.emails,
        }

        const formMode = vm.mode
        switch (formMode) {
          case 'duplicate': {
            $q.when(
              FormApi.duplicateForm(FormToDuplicate._id, formParams),
            ).then((data) => {
              vm.closeCreateModal()
              externalScope.onDuplicateSuccess(data)
            }, handleCreateFormError)
            break
          }
          case 'useTemplate': {
            const { form } = externalScope
            $q.when(FormApi.useTemplate(form._id, formParams)).then((data) => {
              vm.closeCreateModal()
              vm.goToWithId('viewForm', data._id + '')
              GTag.examplesClickCreateNewForm(form)
            }, handleCreateFormError)
            break
          }
          case 'createFromTemplate': {
            // Create new form from template selected
            const newForm = Object.assign({}, vm.template, formParams)
            $q.when(FormApi.createForm(newForm)).then((data) => {
              vm.closeCreateModal()
              vm.goToWithId('viewForm', data._id + '')
            }, handleCreateFormError)
            break
          }
          case 'create': // Create form
            $q.when(FormApi.createForm(formParams)).then((data) => {
              vm.closeCreateModal()
              vm.goToWithId('viewForm', data._id + '')
            }, handleCreateFormError)
            break
        }
      }
    } else {
      Toastr.error('An error occurred creating the form, please try again')
      GTag.createFormFailed()
    }
  }

  vm.handleMailToClick = () => {
    GTag.clickSecretKeyMailto(vm.formData.title)
  }

  // Whether user has copied secret key
  vm.isCopied = false
  vm.copied = () => {
    vm.isCopied = true
    $timeout(() => {
      vm.isCopied = false
    }, 1000)
  }
}
