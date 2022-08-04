'use strict'

const AdminService = require('../../../../services/AdminService')
const { UiCookieValues } = require('../../../../../../shared/types')
angular.module('core').component('reactSwitchBannerComponent', {
  templateUrl:
    'modules/forms/admin/componentViews/react-switch-banner.client.view.html',
  controller: ['$q', '$window', reactSwitchBannerController],
  controllerAs: 'vm',
})

function reactSwitchBannerController($q, $window) {
  const vm = this
  vm.ui = UiCookieValues.React

  vm.adminChooseEnvironment = (ui) => {
    return (
      $q
        .when(AdminService.adminChooseEnvironment(ui))
        // Navigate to the React workspace page after changing the environment cookie
        .then(() => {
          $window.location.assign('/workspace')
        })
        .catch((error) => {
          console.error('switch to react failed:', error)
        })
    )
  }
}
