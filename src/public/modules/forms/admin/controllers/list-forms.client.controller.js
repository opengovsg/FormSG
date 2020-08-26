'use strict'

// Forms controller
angular
  .module('forms')
  .controller('ListFormsController', [
    '$scope',
    'FormApi',
    '$uibModal',
    'Auth',
    'moment',
    '$state',
    '$timeout',
    '$window',
    'Toastr',
    'Betas',
    ListFormsController,
  ])

function ListFormsController(
  $scope,
  FormApi,
  $uibModal,
  Auth,
  moment,
  $state,
  $timeout,
  $window,
  Toastr,
  Betas,
) {
  const vm = this

  vm.bannerContent = $window.siteBannerContent || $window.adminBannerContent

  // Hidden buttons on forms that appear after clicking more
  vm.showFormBtns = []
  // Duplicated form outline on newly dup forms
  vm.duplicatedForms = []
  // Redirect to signin if unable to get user
  vm.user = Auth.getUser() || $state.go('signin')

  // Brings user to edit form page
  vm.editForm = function (form) {
    $state.go('viewForm', { formId: form._id })
  }

  // Watch for changes in forms to recalculate last modified
  $scope.$watch(
    () => vm.myforms,
    () => {
      if (vm.myforms === undefined) {
        return
      }

      // Transform last modified time into readable format
      vm.myforms.forEach(function (form) {
        form.lastModifiedString = moment(form.lastModified).format(
          'D MMM, YYYY',
        )
      })
    },
    true,
  )

  // Return all user's Forms
  vm.listForms = function () {
    // Send non-logged in personnel to sign in page
    if (!vm.user) {
      $state.go('signin', { targetState: 'listForms' }, { location: 'replace' })
      return
    }
    // Massage user email into a name
    turnEmailToName()

    FormApi.query(function (_forms) {
      vm.myforms = _forms
    })
  }

  function turnEmailToName() {
    vm.userName = 'how are you?' // Placeholder
    let name = vm.user.email.split('@')
    if (name.length >= 1) {
      let nameParts = name[0].split('_')
      let userName = ''
      for (let i = 0; i < nameParts.length; i++) {
        let p = nameParts[i]
        if (p.length >= 1) {
          userName += p.charAt(0).toUpperCase()
        }
        if (p.length >= 2) {
          userName += p.substring(1)
        }
        userName += i + 1 === nameParts.length ? '!' : ' '
      }
      vm.userName = userName
    }
  }

  /**
   * DeleteModal functions
   */
  vm.openDeleteModal = function (index) {
    vm.deleteModal = $uibModal.open({
      animation: false,
      templateUrl: 'modules/forms/admin/views/delete-form.client.modal.html',
      windowClass: 'delete-field-modal-window',
      controller: 'DeleteFormModalController',
      controllerAs: 'vm',
      resolve: {
        externalScope: function () {
          return {
            currFormTitle: vm.myforms[index].title,
            formIndex: index,
            myforms: vm.myforms,
          }
        },
      },
    })
  }

  /**
   * CreateModal functions
   */
  vm.openCreateModal = function () {
    vm.createModal = $uibModal.open({
      animation: false,
      templateUrl: 'modules/forms/admin/views/create-form.client.modal.html',
      windowClass: 'full-screen-modal-window',
      controller: 'CreateFormModalController',
      controllerAs: 'vm',
      resolve: {
        FormToDuplicate: () => null,
        createFormModalOptions: () => ({ mode: 'create' }),
        externalScope: () => ({
          myforms: vm.myforms,
          user: vm.user,
        }),
      },
    })
  }

  /**
   * Form Buttons
   */

  vm.viewFormBtns = (formId) => {
    // Reset all other buttons
    vm.showFormBtns = []
    // Set the clicked button to true
    vm.showFormBtns[formId] = true
  }

  // Hide form buttons if area
  // outside form buttons is clicked
  vm.closeListFormModal = () => {
    vm.clearFormBtns()
  }

  vm.clearFormBtns = () => {
    vm.showFormBtns = []
  }

  vm.handleDuplicateSuccess = function (data) {
    // Place duplicated form as first form, and highlight it in blue
    vm.myforms.unshift(data)
    $window.scrollTo({ top: 0, behavior: 'smooth' })
    vm.clearFormBtns()

    // Highlight in blue, then remove after 2s
    vm.duplicatedForms[data._id] = true
    $timeout(() => {
      vm.duplicatedForms[data._id] = false
    }, 2000)
  }

  vm.duplicateForm = function (formIndex) {
    const missingBetaPermissions = Betas.getMissingFieldPermissions(
      vm.user,
      vm.myforms[formIndex],
    )
    if (missingBetaPermissions.length !== 0) {
      const errMsg =
        'You cannot duplicate this form because it has the following beta features' +
        ' which you cannot access: ' +
        missingBetaPermissions.join(', ')
      Toastr.error(errMsg)
      return
    }
    vm.duplicateModal = $uibModal.open({
      animation: false,
      templateUrl: 'modules/forms/admin/views/create-form.client.modal.html',
      windowClass: 'full-screen-modal-window',
      controller: 'CreateFormModalController',
      controllerAs: 'vm',
      resolve: {
        FormToDuplicate: () => {
          // Retrieve the form so that we can populate the modal with any existing email recipients
          return FormApi.preview({
            formId: vm.myforms[formIndex]._id,
          }).$promise.then((res) => res.form)
        },
        createFormModalOptions: () => ({ mode: 'duplicate' }),
        externalScope: () => ({
          myforms: vm.myforms,
          user: vm.user,
          onDuplicateSuccess: vm.handleDuplicateSuccess,
        }),
      },
    })
  }
}
