'use strict'

angular
  .module('core')
  .directive('routeLoadingIndicator', ['$rootScope', routeLoadingIndicator])

function routeLoadingIndicator($rootScope) {
  return {
    restrict: 'E',
    template: `
        <div ng-if='isRouteLoading'
             id='route-loading'>
          <i class='bx bx-loader bx-spin'></i>
        </div>`,
    link: function (scope) {
      scope.isRouteLoading = false

      $rootScope.$on('$stateChangeStart', function () {
        scope.isRouteLoading = true
      })

      $rootScope.$on('$stateChangeSuccess', function () {
        scope.isRouteLoading = false
      })
    },
  }
}
