'use strict'
const { get } = require('lodash')

const {
  ADMIN_VERIFIED_SMS_STATES,
  SMS_VERIFICATION_LIMIT,
} = require('../../../../../shared/util/verification')

const AdminMetaService = require('../../../../services/AdminMetaService')

angular
  .module('forms')
  .directive('configureMobileDirective', [configureMobileDirective])

function configureMobileDirective() {
  return {
    templateUrl:
      'modules/forms/admin/directiveViews/configure-mobile.client.view.html',
    restrict: 'E',
    scope: {
      field: '<',
      form: '<',
      name: '=',
      characterLimit: '=',
      isLoading: '<',
    },
    controller: [
      '$q',
      '$uibModal',
      '$scope',
      '$translate',
      'Toastr',
      function ($q, $uibModal, $scope, $translate, Toastr) {
        // Get the link for onboarding the form from the translation json
        $translate('LINKS.VERIFIED_SMS_SETUP_LINK').then(
          (verifiedSmsSetupLink) => {
            $scope.verifiedSmsSetupLink = verifiedSmsSetupLink
          },
        )

        // NOTE: This is set on scope as it is used by the UI to determine if the toggle is loading
        $scope.isLoading = true
        $scope.field.hasRetrievalError = false

        const getAdminVerifiedSmsState = (verifiedSmsCount, msgSrvcId) => {
          if (msgSrvcId) {
            return ADMIN_VERIFIED_SMS_STATES.hasMessageServiceId
          }
          if (verifiedSmsCount < SMS_VERIFICATION_LIMIT) {
            return ADMIN_VERIFIED_SMS_STATES.belowLimit
          }
          return ADMIN_VERIFIED_SMS_STATES.limitExceeded
        }

        $q.when(
          AdminMetaService.getFreeSmsCountsUsedByFormAdmin($scope.form._id),
        )
          .then(({ smsCounts }) => {
            $scope.verifiedSmsCount = smsCounts
            $scope.adminVerifiedSmsState = getAdminVerifiedSmsState(
              smsCounts,
              $scope.form.msgSrvcName,
            )
            // NOTE: This links into the verifiable field component and hence, is used by both email and mobile
            $scope.field.hasAdminExceededSmsLimit =
              $scope.adminVerifiedSmsState ===
              ADMIN_VERIFIED_SMS_STATES.limitExceeded
          })
          .catch((error) => {
            $scope.field.hasRetrievalError = true
            Toastr.error(
              get(
                error,
                'response.data.message',
                'Sorry, an error occurred. Please refresh the page to toggle OTP verification.',
              ),
            )
          })
          .finally(() => ($scope.isLoading = false))

        // Only open if the admin has sms counts below the limit.
        // If the admin has counts above limit without a message id, the toggle should be disabled anyway.
        // Otherwise, if the admin has a message id, just enable it without the modal
        $scope.openVerifiedSMSModal = function () {
          const isTogglingOnVerifiedSms = !$scope.field.isVerifiable
          const isAdminBelowLimit =
            $scope.adminVerifiedSmsState ===
            ADMIN_VERIFIED_SMS_STATES.belowLimit
          const shouldShowModal =
            isTogglingOnVerifiedSms &&
            isAdminBelowLimit &&
            !$scope.field.hasRetrievalError
          $scope.verifiedSMSModal =
            shouldShowModal &&
            $uibModal.open({
              animation: true,
              backdrop: 'static',
              keyboard: false,
              templateUrl: 'modules/forms/admin/views/pop-up.client.modal.html',
              windowClass: 'pop-up-modal-window',
              controller: 'PopUpModalController',
              controllerAs: 'vm',
              resolve: {
                externalScope: function () {
                  return {
                    title:
                      'OTP verification will be disabled at 10,000 responses',
                    confirmButtonText: 'Accept',
                    description: `
                    We provide SMS OTP verification for free up to 10,000 responses. OTP verification will be automatically disabled when your account reaches 10,000 responses. 
                    <br></br>
                    If you require OTP verification for more than 10,000 responses,
                    <a href=${$scope.verifiedSmsSetupLink} target="_blank" class=""> please arrange advance billing with us. </a>  

                    <br></br>
                    <small>Current response count: ${$scope.verifiedSmsCount}/${SMS_VERIFICATION_LIMIT}</small>
                    `,
                    isImportant: true,
                  }
                },
              },
            })
        }
      },
    ],
  }
}
