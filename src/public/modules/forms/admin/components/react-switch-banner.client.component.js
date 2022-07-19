'use strict'

const AdminService = require('../../../../services/AdminService')
const { UiCookieValues } = require('../../../../../../shared/types')
angular.module('core').component('reactSwitchBannerComponent', {
  templateUrl:
    'modules/forms/admin/componentViews/react-switch-banner.client.view.html',
  controller: ['$scope', '$q', '$window', reactSwitchBannerController],
  controllerAs: 'vm',
})

function reactSwitchBannerController($scope, $q, $window) {
  const vm = this
  $scope.ui = UiCookieValues.React

  vm.adminChooseEnvironment = (ui) => {
    return (
      $q
        .when(AdminService.adminChooseEnvironment(ui))
        // Refresh the page after changing the environment cookie
        .then(() => {
          $window.location.reload(true)
        })
        .catch((error) => {
          console.error('switch to react failed:', error)
        })
    )
  }
}
