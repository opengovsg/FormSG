/**
 * @typedef {{
 *  startDate?: import("moment").Moment,
 *  endDate?: import("moment").Moment
 * }} DateRangePickerModel
 */

angular
  .module('forms')
  .directive('dateRangePickerDirective', [dateRangePickerDirective])

function dateRangePickerDirective() {
  return {
    templateUrl:
      'modules/forms/admin/directiveViews/daterangepicker.client.view.html',
    restrict: 'E',
    scope: false,
    require: 'ngModel',
    link: function ($scope, iElement, iAttrs, ngModelCtrl) {
      $scope.options = {
        locale: {
          format: 'D MMM YYYY', // 26 Mar 2020
        },
        showDropdowns: true,
        autoApply: true,
      }

      ngModelCtrl.$render = function () {
        $scope.date = ngModelCtrl.$viewValue
      }

      $scope.$watch('date', function () {
        ngModelCtrl.$setViewValue($scope.date)
      })

      $scope.removeDateRangeOnBackspace = function (e) {
        let keyCode = e.keyCode ? e.keyCode : e.which
        // Backspace or delete keycode, we clear the value.
        if (keyCode === 8 || keyCode === 46) {
          $scope.date = {
            startDate: null,
            endDate: null,
          }
        } else {
          e.preventDefault()
        }
      }
    },
  }
}
