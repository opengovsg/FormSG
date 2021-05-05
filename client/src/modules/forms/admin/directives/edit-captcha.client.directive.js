'use strict'

angular
  .module('forms')
  .directive('editCaptchaDirective', [editCaptchaDirective])

function editCaptchaDirective() {
  return {
    templateUrl:
      'modules/forms/admin/directiveViews/edit-captcha.client.view.html',
    restrict: 'E',
    scope: {
      tempForm: '=',
      updateSettings: '<',
    },
    controller: [
      '$scope',
      function ($scope) {
        $scope.updateCaptcha = function (isChecked) {
          $scope.updateSettings('hasCaptcha', isChecked)
        }
      },
    ],
  }
}
