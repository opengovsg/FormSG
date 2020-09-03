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
        $translate('LINKS.SUPPORT_FORM_LINK').then((supportFormLink) => {
          $scope.supportFormLink = supportFormLink
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
                    title: 'Verified SMS',
                    confirmButtonText: 'OK, Noted',
                    description: `
                      FormSG provides free verified SMS <b>up to 10,000 responses</b>
                      <b>per form</b>. If you expect >10k responses, please <a href=${$scope.supportFormLink} target="_blank" class="">contact us</a> 
                      to arrange billing for verified SMS. <b>Failure to do so risks your form</b>
                      <b>being deactivated for submissions</b>.
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
