'use strict'
const { get } = require('lodash')

const {
  ADMIN_VERIFIED_SMS_STATES,
} = require('../../../../../../shared/utils/verification')

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
      smsVerificationLimit: '=',
      verifiedSmsCount: '=',
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

        // Formats a given string as a number by setting it to US locale.
        // Concretely, this adds commas between every thousand.
        const formatStringAsNumber = (num) =>
          Number(num).toLocaleString('en-US')

        // NOTE: This is set on scope as it is used by the UI to determine if the toggle is loading
        $scope.isLoading = true
        $scope.field.hasRetrievalError = false

        const getAdminVerifiedSmsState = (
          verifiedSmsCount,
          msgSrvcId,
          freeSmsQuota,
        ) => {
          if (msgSrvcId) {
            return ADMIN_VERIFIED_SMS_STATES.hasMessageServiceId
          }

          if (verifiedSmsCount <= freeSmsQuota) {
            return ADMIN_VERIFIED_SMS_STATES.belowLimit
          }

          return ADMIN_VERIFIED_SMS_STATES.limitExceeded
        }

        $q.when(
          AdminMetaService.getFreeSmsCountsUsedByFormAdmin($scope.form._id),
        )
          .then(({ quota, freeSmsCounts }) => {
            $scope.verifiedSmsCount = formatStringAsNumber(freeSmsCounts)
            $scope.adminVerifiedSmsState = getAdminVerifiedSmsState(
              freeSmsCounts,
              $scope.form.msgSrvcName,
              quota,
            )
            $scope.smsVerificationLimit = formatStringAsNumber(quota)

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
                    title: `OTP verification will be disabled at ${$scope.smsVerificationLimit} responses`,
                    confirmButtonText: 'I understand',
                    description: `
                    We provide ${$scope.smsVerificationLimit} free SMS OTP verifications per account, only counting owned forms. 

                    Once this limit is reached, SMS OTP verification will be automatically disabled for all owned forms. Forms with Twilio already set up will not be affected.

                    <br></br>

                    If you are a collaborator, ensure the form's owner has enough free verifications. 

                    <br></br>

                    If you require more than ${$scope.smsVerificationLimit} verifications, please <a href=${$scope.verifiedSmsSetupLink} target="_blank" class=""> arrange advance billing with us. </a>  

                    <br></br>
                    <small>Current response count: ${$scope.verifiedSmsCount}/${$scope.smsVerificationLimit}</small>
                    `,
                  }
                },
              },
            })
        }
      },
    ],
  }
}
