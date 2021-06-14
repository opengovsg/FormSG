'use strict'

angular
  .module('forms')
  .directive('configureMobileDirective', [configureMobileDirective])

function configureMobileDirective() {
  return {
    templateUrl:
      'modules/forms/admin/directiveViews/configure-mobile.client.view.html',
    restrict: 'E',
    scope: {
      field: '=',
      name: '=',
      characterLimit: '=',
    },
    controller: [
      '$uibModal',
      '$scope',
      '$translate',
      function ($uibModal, $scope, $translate) {
        // Get support form link from translation json.
        $translate('LINKS.TWILIO_SETUP_LINK').then((twilioSetupLink) => {
          $scope.twilioSetupLink = twilioSetupLink
        })

        $scope.openVerifiedSMSModal = function () {
          const isTogglingOnVerifiedSms = !$scope.field.isVerifiable
          $scope.verifiedSMSModal =
            isTogglingOnVerifiedSms &&
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
                    <a href=${
                      $scope.twilioSetupLink
                    } target="_blank" class=""> please arrange advance billing with us. </a>  

                    <br></br>
                    <small>Current response count: ${0}/${0}</small>
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
