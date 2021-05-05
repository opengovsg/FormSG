'use strict'

angular
  .module('forms')
  .directive('configureFormDirective', [configureFormDirective])

function configureFormDirective() {
  return {
    templateUrl:
      'modules/forms/admin/directiveViews/configure-form.client.view.html',
    restrict: 'E',
    scope: {
      formMode: '=',
      formData: '=',
      formController: '=',
      saveForm: '&',
    },
    controller: [
      '$scope',
      'responseModeEnum',
      function ($scope, responseModeEnum) {
        // Pass enum to view
        $scope.responseModeEnum = responseModeEnum
      },
    ],
  }
}
