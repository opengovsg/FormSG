'use strict'

angular.module('users').directive('examplesCard', [examplesCard])

function examplesCard() {
  return {
    templateUrl: 'modules/users/views/examples-card.client.view.html',
    restrict: 'E',
    scope: {
      form: '<',
      // true if this is the example card of a form specified for use-template.
      // Used as a flag to automatically call openClientModal()
      autoOpenModal: '<',
    },
    controller: [
      '$scope',
      'FormApi',
      'emoji',
      '$uibModal',
      '$state',
      'GTag',
      'Auth',
      '$location',
      'Betas',
      'Toastr',
      examplesCardController,
    ],
  }
}

function examplesCardController(
  $scope,
  FormApi,
  emoji,
  $uibModal,
  $state,
  GTag,
  Auth,
  $location,
  Betas,
  Toastr,
) {
  $scope.user = Auth.getUser()

  $scope.openTemplateModal = () => {
    $scope.templateUrl = $state.href(
      'templateForm',
      { formId: $scope.form._id },
      { absolute: true },
    )
    $scope.feedbackScore = $scope.form.avgFeedback
      ? $scope.form.avgFeedback.toFixed(2)
      : '-'
    $scope.emojiUrl = emoji.getUrlFromScore($scope.form.avgFeedback)
    $scope.showTemplate = true
    $scope.showIframeSpinner = true
    angular.element('body').addClass('modal-open')

    GTag.examplesClickOpenTemplate($scope.form)
  }

  $scope.closeTemplateModal = () => {
    $scope.showTemplate = false
    angular.element('body').removeClass('modal-open')
    // If this was a use-template page, send them back to examples page when they close the modal
    if ($scope.autoOpenModal) {
      $state.go('examples')
    }
    GTag.examplesClickCloseTemplate($scope.form)
  }

  $scope.onIframeLoad = () => {
    $scope.showIframeSpinner = false
    $scope.$apply()
  }

  /**
   * Copy Template Modal functions
   */

  $scope.useTemplate = function () {
    const missingBetaPermissions = Betas.getMissingFieldPermissions(
      $scope.user,
      $scope.form,
    )
    if (missingBetaPermissions.length !== 0) {
      const errMsg =
        'You cannot use this template because it has the following beta fields' +
        ' which you cannot access: ' +
        missingBetaPermissions.join(', ')
      Toastr.error(errMsg)
      return
    }
    $scope.createModal = $uibModal.open({
      animation: false,
      templateUrl: 'modules/forms/admin/views/create-form.client.modal.html',
      windowClass: 'full-screen-modal-window',
      controller: 'CreateFormModalController',
      controllerAs: 'vm',
      resolve: {
        FormToDuplicate: () => {
          return FormApi.template({
            formId: $scope.form._id,
          }).$promise.then((res) => res.form)
        },
        createFormModalOptions: () => ({ mode: 'useTemplate' }),
        externalScope: () => ({
          user: $scope.user,
          form: $scope.form,
        }),
      },
    })
  }

  // Open the specified form template
  // Used for /:formId/use-template
  if ($scope.autoOpenModal) {
    $scope.openTemplateModal()
  }
}
